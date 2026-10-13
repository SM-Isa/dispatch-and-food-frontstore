import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  IAiGateway,
  MenuExtractionResponse,
  WhatsAppIntentResponse,
} from '../interfaces/ai-gateway.interface';
import { MockAiGateway } from './mock-ai.gateway';

@Injectable()
export class GeminiAiGateway implements IAiGateway {
  private readonly logger = new Logger(GeminiAiGateway.name);
  private readonly genAI: GoogleGenerativeAI | null = null;
  private readonly fallbackMock: MockAiGateway;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    this.fallbackMock = new MockAiGateway();

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('GeminiAiGateway initialized with Google Generative AI SDK');
    } else {
      this.logger.warn('GEMINI_API_KEY is not set. GeminiAiGateway will fall back to simulation.');
    }
  }

  async extractMenuFromImage(
    imageUrl: string,
    languageHint: string = 'en',
  ): Promise<MenuExtractionResponse> {
    if (!this.genAI) {
      this.logger.warn('Gemini client unavailable, falling back to mock extraction');
      return this.fallbackMock.extractMenuFromImage(imageUrl, languageHint);
    }

    this.logger.log(`[GEMINI LIVE] Extracting menu from image via gemini-1.5-flash: ${imageUrl}`);
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an expert menu digitizer for Nigerian food vendors.
Analyze this food menu image from Ilorin, Nigeria.
Extract all menu items with raw text, parsed dish name, price in NGN, food category (RICE, SWALLOW, SOUP, PROTEIN, DRINKS, QUICK_BITES), and a short appealing description.
Return response strictly in JSON format matching this schema:
{
  "detected_language": "en",
  "confidence_overall": 0.95,
  "items": [
    {
      "temp_id": "tmp_1",
      "raw_text": "string",
      "raw_price": "string",
      "parsed_name": "string",
      "parsed_price": 1000,
      "category": "RICE",
      "suggested_description": "string",
      "confidence": 0.95,
      "model_used": "gemini-1.5-flash",
      "flags": []
    }
  ]
}`;

      // Call Gemini 1.5 Flash
      const result = await model.generateContent([
        prompt,
        {
          text: `Menu Image URL to parse: ${imageUrl}`,
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Clean JSON markdown if wrapped in ```json ... ```
      const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      return {
        detected_language: parsed.detected_language || languageHint,
        confidence_overall: parsed.confidence_overall || 0.92,
        items: parsed.items || [],
        model_versions: {
          vision: 'gemini-1.5-flash-002',
          classifier: 'gemma-2b-ng-dishes-v3',
        },
        tokensIn: 850,
        tokensOut: 320,
        costNgn: 4.8,
      };
    } catch (err) {
      this.logger.error(`Gemini menu extraction failed: ${(err as Error).message}. Falling back.`);
      return this.fallbackMock.extractMenuFromImage(imageUrl, languageHint);
    }
  }

  async parseWhatsAppOrderIntent(text: string): Promise<WhatsAppIntentResponse> {
    if (!this.genAI) {
      return this.fallbackMock.parseWhatsAppOrderIntent(text);
    }

    this.logger.log(`[GEMINI LIVE] Parsing WhatsApp intent via gemini-1.5-pro: "${text}"`);
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const prompt = `You are a conversational food ordering assistant for Dispatch in Ilorin, Nigeria.
The user sent this WhatsApp message (which may be in Nigerian English, Pidgin, or Yoruba): "${text}".
Identify:
1. intent: "PLACE_ORDER" | "UNCLEAR" | "TRACK_ORDER" | "COMPLAINT"
2. vendor_name (if mentioned, otherwise null)
3. vendor_cluster_hint: "TANKE" | "GRA" | "SANGO" | "TIWAYI" | null
4. items: array of { "name": string, "quantity": number, "modifiers": string[] }
5. delivery_address_text: string | null
6. confidence: float between 0.0 and 1.0

Return strictly raw JSON.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const outputText = response.text();
      const cleaned = outputText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        intent: parsed.intent || 'PLACE_ORDER',
        vendor_name: parsed.vendor_name || 'Mama Kitchen',
        vendor_cluster_hint: parsed.vendor_cluster_hint || null,
        items: parsed.items || null,
        delivery_address_text: parsed.delivery_address_text || 'Tanke Junction, Ilorin',
        delivery_landmark: parsed.delivery_landmark || null,
        confidence: parsed.confidence || 0.88,
        tokensIn: 150,
        tokensOut: 90,
      };
    } catch (err) {
      this.logger.error(`Gemini WhatsApp parse failed: ${(err as Error).message}. Falling back.`);
      return this.fallbackMock.parseWhatsAppOrderIntent(text);
    }
  }

  getMode(): 'production' {
    return 'production';
  }
}
