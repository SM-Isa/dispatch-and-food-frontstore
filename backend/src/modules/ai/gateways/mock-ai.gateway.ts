import { Injectable, Logger } from '@nestjs/common';
import {
  IAiGateway,
  MenuExtractionResponse,
  WhatsAppIntentResponse,
} from '../interfaces/ai-gateway.interface';

@Injectable()
export class MockAiGateway implements IAiGateway {
  private readonly logger = new Logger(MockAiGateway.name);

  async extractMenuFromImage(
    imageUrl: string,
    languageHint: string = 'en',
  ): Promise<MenuExtractionResponse> {
    this.logger.debug(`[MOCK AI GATEWAY] Simulating menu extraction for ${imageUrl}`);

    return {
      detected_language: languageHint,
      confidence_overall: 0.94,
      items: [
        {
          temp_id: 'tmp_1',
          raw_text: 'Jollof Rice + Grilled Chicken',
          raw_price: '3200',
          parsed_name: 'Jollof Rice + Grilled Chicken',
          parsed_price: 3200.0,
          category: 'RICE',
          subcategory: 'Jollof',
          suggested_description: 'Smoky party-style jollof rice with spiced grilled chicken',
          confidence: 0.96,
          bounding_box: { x: 80, y: 140, w: 420, h: 50 },
          model_used: 'gemini-1.5-flash-vision',
          flags: [],
        },
        {
          temp_id: 'tmp_2',
          raw_text: 'Amala with Gbegiri & Ewedu Soup',
          raw_price: '2800',
          parsed_name: 'Amala with Gbegiri & Ewedu Soup',
          parsed_price: 2800.0,
          category: 'SWALLOW',
          subcategory: 'Amala',
          suggested_description: 'Smooth yam flour swallow served with blended gbegiri and ewedu soup',
          confidence: 0.93,
          bounding_box: { x: 80, y: 210, w: 450, h: 50 },
          model_used: 'gemini-1.5-flash-vision',
          flags: [],
        },
        {
          temp_id: 'tmp_3',
          raw_text: 'Special Beef Shawarma',
          raw_price: '2500',
          parsed_name: 'Special Beef Shawarma',
          parsed_price: 2500.0,
          category: 'QUICK_BITES',
          subcategory: 'Shawarma',
          suggested_description: 'Toasted pita loaded with seasoned beef strips and sausage',
          confidence: 0.88,
          bounding_box: { x: 80, y: 280, w: 380, h: 50 },
          model_used: 'gemini-1.5-flash-vision',
          flags: [],
        },
      ],
      model_versions: {
        vision: 'gemini-1.5-flash-002',
        classifier: 'gemma-2b-ng-dishes-v3',
      },
      tokensIn: 850,
      tokensOut: 240,
      costNgn: 4.5,
    };
  }

  async parseWhatsAppOrderIntent(text: string): Promise<WhatsAppIntentResponse> {
    this.logger.debug(`[MOCK AI GATEWAY] Simulating WhatsApp order intent parsing for: "${text}"`);

    const isTanke = /tanke/i.test(text);
    const isGra = /gra/i.test(text);
    const hasJollof = /jollof/i.test(text);
    const hasAmala = /amala/i.test(text);

    let confidence = 0.90;
    const items: Array<{ name: string; quantity: number; modifiers: string[] }> = [];

    if (hasJollof) items.push({ name: 'Jollof Rice', quantity: 1, modifiers: ['chicken'] });
    if (hasAmala) items.push({ name: 'Amala', quantity: 2, modifiers: ['assorted meat'] });

    const clusterHint = isTanke ? 'TANKE' : isGra ? 'GRA' : null;
    if (!clusterHint) {
      confidence = 0.72;
    }

    return {
      intent: items.length > 0 ? 'PLACE_ORDER' : 'UNCLEAR',
      vendor_name: 'Mama Kitchen',
      vendor_cluster_hint: clusterHint,
      items: items.length > 0 ? items : null,
      delivery_address_text: 'Tanke Junction, Ilorin',
      delivery_landmark: 'Near UNILORIN gate',
      confidence,
      tokensIn: 120,
      tokensOut: 80,
    };
  }

  getMode(): 'mock' {
    return 'mock';
  }
}
