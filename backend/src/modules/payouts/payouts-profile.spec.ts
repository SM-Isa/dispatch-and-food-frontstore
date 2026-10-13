import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PAYOUT_GATEWAY, IPayoutGateway } from './interfaces/payout-gateway.interface';
import { MockPayoutGateway } from './gateways/mock-payout.gateway';
import { MonnifyPayoutGateway } from './gateways/monnify-payout.gateway';

describe('PayoutGateway Profile Resolution (Spring Boot Style)', () => {
  const createModuleWithEnv = async (envConfig: Record<string, string>): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        MockPayoutGateway,
        MonnifyPayoutGateway,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => envConfig[key],
          },
        },
        {
          provide: PAYOUT_GATEWAY,
          useFactory: (
            config: ConfigService,
            mockGateway: MockPayoutGateway,
            monnifyGateway: MonnifyPayoutGateway,
          ) => {
            const profile = (
              config.get<string>('PAYOUT_MODE') ||
              (config.get<string>('NODE_ENV') === 'production' ? 'production' : 'mock')
            ).toLowerCase();

            if (profile === 'production' || profile === 'live' || profile === 'monnify') {
              return monnifyGateway;
            }
            return mockGateway;
          },
          inject: [ConfigService, MockPayoutGateway, MonnifyPayoutGateway],
        },
      ],
    }).compile();
  };

  it('should inject MockPayoutGateway when profile is "mock" or default development/test', async () => {
    const module = await createModuleWithEnv({ PAYOUT_MODE: 'mock', NODE_ENV: 'development' });
    const gateway = module.get<IPayoutGateway>(PAYOUT_GATEWAY);

    expect(gateway).toBeInstanceOf(MockPayoutGateway);
    expect(gateway.getMode()).toBe('mock');

    const result = await gateway.initiatePayout({
      payoutId: 'payout-123',
      amount: 15000,
      bankCode: '035',
      accountNumber: '0123456789',
      accountName: 'Ibrahim Rider',
      narration: 'Weekly rider payout',
      providerRef: 'PO-TEST-1',
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('PAID');
    expect(result.externalReference).toMatch(/^SIM_NIP_/);
  });

  it('should inject MonnifyPayoutGateway when profile is "production"', async () => {
    const module = await createModuleWithEnv({
      PAYOUT_MODE: 'production',
      NODE_ENV: 'production',
      MONNIFY_API_KEY: 'test_key',
      MONNIFY_SECRET_KEY: 'test_secret',
    });
    const gateway = module.get<IPayoutGateway>(PAYOUT_GATEWAY);

    expect(gateway).toBeInstanceOf(MonnifyPayoutGateway);
    expect(gateway.getMode()).toBe('production');
  });
});
