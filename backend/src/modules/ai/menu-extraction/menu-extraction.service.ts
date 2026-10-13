import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { AiClientService } from '../ai-client.service';
import { createHash } from 'crypto';

export interface ConfirmedMenuItemDto {
  name: string;
  price: number;
  category?: string;
  description?: string;
  imageUrl?: string;
}

@Injectable()
export class MenuExtractionService {
  private readonly logger = new Logger(MenuExtractionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiClient: AiClientService,
  ) {}

  /**
   * Stage 1 & 2: Multimodal Gemini 1.5 Flash Vision extraction + Gemma 2B normalization
   */
  async extractMenu(vendorId: string, imageUrl: string, languageHint = 'en') {
    if (!imageUrl) {
      throw new BadRequestException('imageUrl is required for menu extraction');
    }

    const imageSha256 = createHash('sha256').update(imageUrl).digest('hex');

    // Check for duplicate / cached upload within same vendor
    const existing = await this.prisma.menuExtraction.findFirst({
      where: {
        vendorId,
        imageSha256,
        status: { in: ['PENDING_REVIEW', 'CONFIRMED'] },
      },
    });

    if (existing) {
      this.logger.log(`Found cached menu extraction ${existing.id} for image ${imageSha256}`);
      return {
        extractionId: existing.id,
        cached: true,
        status: existing.status,
        confidence: existing.confidence ? Number(existing.confidence) : 0.9,
        items: (existing.rawResponse as any)?.items || [],
        detectedLanguage: existing.detectedLanguage,
        modelVersions: {
          vision: existing.visionModel,
          classifier: existing.classifierModel,
        },
      };
    }

    // Call Multimodal Gemini Vision
    const aiResult = await this.aiClient.extractMenuFromImage(imageUrl, languageHint);

    const extraction = await this.prisma.menuExtraction.create({
      data: {
        vendorId,
        imageUrl,
        imageSha256,
        status: 'PENDING_REVIEW',
        detectedLanguage: aiResult.detected_language,
        confidence: aiResult.confidence_overall,
        rawResponse: aiResult as any,
        visionModel: aiResult.model_versions.vision,
        classifierModel: aiResult.model_versions.classifier,
      },
    });

    return {
      extractionId: extraction.id,
      cached: false,
      status: extraction.status,
      confidence: aiResult.confidence_overall,
      items: aiResult.items,
      detectedLanguage: aiResult.detected_language,
      modelVersions: aiResult.model_versions,
    };
  }

  /**
   * Stage 3: Vendor Review & One-Click Catalog Import
   */
  async confirmMenuExtraction(
    extractionId: string,
    vendorId: string,
    confirmedItems: ConfirmedMenuItemDto[],
  ) {
    const extraction = await this.prisma.menuExtraction.findUnique({
      where: { id: extractionId },
    });

    if (!extraction) {
      throw new NotFoundException(`Menu extraction ${extractionId} not found`);
    }

    if (extraction.vendorId !== vendorId) {
      throw new BadRequestException('Extraction does not belong to the specified vendor');
    }

    if (!confirmedItems || confirmedItems.length === 0) {
      throw new BadRequestException('At least one menu item must be confirmed');
    }

    // Transactional catalog creation
    const createdProducts = await this.prisma.$transaction(async (tx) => {
      const products = [];
      let sortOrder = 0;

      for (const item of confirmedItems) {
        const prod = await tx.product.create({
          data: {
            vendorId,
            name: item.name.trim(),
            description: item.description?.trim() || null,
            price: item.price,
            category: item.category || 'GENERAL',
            imageUrl: item.imageUrl || null,
            isAvailable: true,
            isPublished: true,
            sortOrder: sortOrder++,
          },
        });
        products.push(prod);
      }

      await tx.menuExtraction.update({
        where: { id: extractionId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      return products;
    });

    this.logger.log(`Confirmed extraction ${extractionId}: created ${createdProducts.length} products`);

    return {
      success: true,
      extractionId,
      createdCount: createdProducts.length,
      products: createdProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        category: p.category,
      })),
    };
  }

  async getExtraction(id: string) {
    const extraction = await this.prisma.menuExtraction.findUnique({
      where: { id },
    });
    if (!extraction) {
      throw new NotFoundException(`Menu extraction ${id} not found`);
    }
    return extraction;
  }

  async getVendorExtractions(vendorId: string) {
    return this.prisma.menuExtraction.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
