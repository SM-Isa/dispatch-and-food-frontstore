import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NOTIFICATION_GATEWAY, INotificationGateway } from './interfaces/notification-gateway.interface';
import { MockNotificationGateway } from './gateways/mock-notification.gateway';
import { TermiiNotificationGateway } from './gateways/termii-notification.gateway';
import { NotificationChannel } from '@dispatch/shared';

describe('NotificationGateway Profile Resolution (Spring Boot Style)', () => {
  const createModuleWithEnv = async (envConfig: Record<string, string>): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        MockNotificationGateway,
        TermiiNotificationGateway,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => envConfig[key],
          },
        },
        {
          provide: NOTIFICATION_GATEWAY,
          useFactory: (
            config: ConfigService,
            mockGateway: MockNotificationGateway,
            termiiGateway: TermiiNotificationGateway,
          ) => {
            const profile = (
              config.get<string>('NOTIFICATION_MODE') ||
              (config.get<string>('NODE_ENV') === 'production' ? 'production' : 'mock')
            ).toLowerCase();

            if (profile === 'production' || profile === 'live' || profile === 'termii') {
              return termiiGateway;
            }
            return mockGateway;
          },
          inject: [ConfigService, MockNotificationGateway, TermiiNotificationGateway],
        },
      ],
    }).compile();
  };

  it('should inject MockNotificationGateway when profile is "mock" or default development/test', async () => {
    const module = await createModuleWithEnv({ NOTIFICATION_MODE: 'mock', NODE_ENV: 'development' });
    const gateway = module.get<INotificationGateway>(NOTIFICATION_GATEWAY);

    expect(gateway).toBeInstanceOf(MockNotificationGateway);
    expect(gateway.getMode()).toBe('mock');

    const result = await gateway.send({
      channel: NotificationChannel.SMS,
      recipient: '+2348012345678',
      template: 'OTP_VERIFICATION',
      payload: { code: '123456' },
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe('MOCK');
    expect(result.messageId).toMatch(/^sim_msg_/);
  });

  it('should inject TermiiNotificationGateway when profile is "production"', async () => {
    const module = await createModuleWithEnv({
      NOTIFICATION_MODE: 'production',
      NODE_ENV: 'production',
      TERMII_API_KEY: 'test_api_key',
    });
    const gateway = module.get<INotificationGateway>(NOTIFICATION_GATEWAY);

    expect(gateway).toBeInstanceOf(TermiiNotificationGateway);
    expect(gateway.getMode()).toBe('production');
  });
});
