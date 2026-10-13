import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AI_GATEWAY, IAiGateway } from './interfaces/ai-gateway.interface';
import { MockAiGateway } from './gateways/mock-ai.gateway';
import { GeminiAiGateway } from './gateways/gemini-ai.gateway';

describe('AiGateway Profile Resolution (Spring Boot Style)', () => {
  const createModuleWithEnv = async (envConfig: Record<string, string>): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        MockAiGateway,
        GeminiAiGateway,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => envConfig[key],
          },
        },
        {
          provide: AI_GATEWAY,
          useFactory: (
            config: ConfigService,
            mockGateway: MockAiGateway,
            geminiGateway: GeminiAiGateway,
          ) => {
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
      ],
    }).compile();
  };

  it('should inject MockAiGateway when profile is "mock" or default development/test', async () => {
    const module = await createModuleWithEnv({ AI_MODE: 'mock', NODE_ENV: 'development' });
    const gateway = module.get<IAiGateway>(AI_GATEWAY);

    expect(gateway).toBeInstanceOf(MockAiGateway);
    expect(gateway.getMode()).toBe('mock');

    const result = await gateway.extractMenuFromImage('https://cdn.dispatch.ng/menus/mama_kitchen.jpg');
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.confidence_overall).toBeGreaterThan(0.9);
  });

  it('should inject GeminiAiGateway when profile is "production"', async () => {
    const module = await createModuleWithEnv({
      AI_MODE: 'production',
      NODE_ENV: 'production',
      GEMINI_API_KEY: 'test_gemini_key',
    });
    const gateway = module.get<IAiGateway>(AI_GATEWAY);

    expect(gateway).toBeInstanceOf(GeminiAiGateway);
    expect(gateway.getMode()).toBe('production');
  });
});
