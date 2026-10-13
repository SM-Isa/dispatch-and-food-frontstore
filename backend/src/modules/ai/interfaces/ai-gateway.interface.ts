export const AI_GATEWAY = Symbol('AI_GATEWAY');

export interface MenuExtractionItem {
  temp_id: string;
  raw_text: string;
  raw_price: string;
  parsed_name: string;
  parsed_price: number;
  category: string;
  subcategory?: string;
  suggested_description: string;
  confidence: number;
  bounding_box?: { x: number; y: number; w: number; h: number };
  model_used: string;
  flags: string[];
  [key: string]: any;
}

export interface MenuExtractionResponse {
  detected_language: string;
  confidence_overall: number;
  items: MenuExtractionItem[];
  model_versions: { vision: string; classifier: string };
  tokensIn?: number;
  tokensOut?: number;
  costNgn?: number;
  [key: string]: any;
}

export interface WhatsAppIntentResponse {
  intent: 'PLACE_ORDER' | 'UNCLEAR' | 'TRACK_ORDER' | 'COMPLAINT';
  vendor_name: string | null;
  vendor_cluster_hint: string | null;
  items: Array<{ name: string; quantity: number; modifiers: string[] }> | null;
  delivery_address_text: string | null;
  delivery_landmark: string | null;
  confidence: number;
  tokensIn?: number;
  tokensOut?: number;
}

export interface IAiGateway {
  extractMenuFromImage(imageUrl: string, languageHint?: string): Promise<MenuExtractionResponse>;
  parseWhatsAppOrderIntent(text: string): Promise<WhatsAppIntentResponse>;
  getMode(): 'mock' | 'production';
}
