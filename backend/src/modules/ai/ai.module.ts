import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiClientService } from './ai-client.service';
import { MenuExtractionService } from './menu-extraction/menu-extraction.service';
import { MenuExtractionController } from './menu-extraction/menu-extraction.controller';
import { ConversationsService } from './conversations/conversations.service';
import { WhatsAppWebhookController } from './conversations/whatsapp.webhook.controller';
import { ForecastService } from './forecast/forecast.service';
import { ForecastController } from './forecast/forecast.controller';
import { FraudService } from './fraud/fraud.service';
import { FraudController } from './fraud/fraud.controller';
import { SupportService } from './support/support.service';
import { SupportController } from './support/support.controller';
import { MockAiGateway } from './gateways/mock-ai.gateway';
import { GeminiAiGateway } from './gateways/gemini-ai.gateway';
import { AI_GATEWAY } from './interfaces/ai-gateway.interface';

@Module({
  imports: [ConfigModule],
  controllers: [
    MenuExtractionController,
    WhatsAppWebhookController,
    ForecastController,
    FraudController,
    SupportController,
  ],
  providers: [
    MockAiGateway,
    GeminiAiGateway,
    {
      provide: AI_GATEWAY,
      useFactory: (
        config: ConfigService,
        mockGateway: MockAiGateway,
        geminiGateway: GeminiAiGateway,
      ) => {
        // Equivalent to Spring Boot active profiles (@Profile("mock") vs @Profile("prod")):
        // 1. Explicit override via AI_MODE ('mock' | 'production' | 'gemini')
        // 2. Or if GEMINI_API_KEY is present and NODE_ENV is production
        const profile = (
          config.get<string>('AI_MODE') ||
          (config.get<string>('NODE_ENV') === 'production' && config.get<string>('GEMINI_API_KEY')
            ? 'production'
            : 'mock')
        ).toLowerCase();

        if (profile === 'production' || profile === 'live' || profile === 'gemini') {
          return geminiGateway;
        }
        return mockGateway;
      },
      inject: [ConfigService, MockAiGateway, GeminiAiGateway],
    },
    AiClientService,
    MenuExtractionService,
    ConversationsService,
    ForecastService,
    FraudService,
    SupportService,
  ],
  exports: [
    AiClientService,
    AI_GATEWAY,
    MenuExtractionService,
    ConversationsService,
    ForecastService,
    FraudService,
    SupportService,
  ],
})
export class AiModule {}
