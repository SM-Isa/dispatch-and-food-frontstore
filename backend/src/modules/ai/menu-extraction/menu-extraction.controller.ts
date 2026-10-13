import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MenuExtractionService, ConfirmedMenuItemDto } from './menu-extraction.service';

class ExtractMenuDto {
  vendorId: string;
  imageUrl: string;
  languageHint?: string;
}

class ConfirmExtractionDto {
  vendorId: string;
  items: ConfirmedMenuItemDto[];
}

@Controller('ai/menu')
export class MenuExtractionController {
  constructor(private readonly menuExtractionService: MenuExtractionService) {}

  @Post('extract')
  @HttpCode(HttpStatus.OK)
  async extractMenu(@Body() dto: ExtractMenuDto) {
    return this.menuExtractionService.extractMenu(
      dto.vendorId,
      dto.imageUrl,
      dto.languageHint,
    );
  }

  @Post('extract/:id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmExtraction(
    @Param('id') id: string,
    @Body() dto: ConfirmExtractionDto,
  ) {
    return this.menuExtractionService.confirmMenuExtraction(
      id,
      dto.vendorId,
      dto.items,
    );
  }

  @Get('extractions/:vendorId')
  async getVendorExtractions(@Param('vendorId') vendorId: string) {
    return this.menuExtractionService.getVendorExtractions(vendorId);
  }

  @Get(':id')
  async getExtraction(@Param('id') id: string) {
    return this.menuExtractionService.getExtraction(id);
  }
}
