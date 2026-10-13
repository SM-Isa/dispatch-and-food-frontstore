import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PAYMENT_GATEWAY, IPaymentGateway } from './interfaces/payment-gateway.interface';
import { MockPaymentGateway } from './gateways/mock-payment.gateway';
import { MonnifyPaymentGateway } from './gateways/monnify-payment.gateway';
import { PaymentProvider } from '@dispatch/shared';

describe('PaymentGateway Profile Resolution (Spring Boot Style)', () => {
  const createModuleWithEnv = async (envConfig: Record<string, string>): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        MockPaymentGateway,
        MonnifyPaymentGateway,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => envConfig[key],
          },
        },
        {
          provide: PAYMENT_GATEWAY,
          useFactory: (
            config: ConfigService,
            mockGateway: MockPaymentGateway,
            monnifyGateway: MonnifyPaymentGateway,
          ) => {
            const profile = (
              config.get<string>('PAYMENT_MODE') ||
              (config.get<string>('NODE_ENV') === 'production' ? 'production' : 'mock')
            ).toLowerCase();

            if (profile === 'production' || profile === 'live' || profile === 'monnify') {
              return monnifyGateway;
            }
            return mockGateway;
          },
          inject: [ConfigService, MockPaymentGateway, MonnifyPaymentGateway],
        },
      ],
    }).compile();
  };

  it('should inject MockPaymentGateway when profile is "mock" or default development/test', async () => {
    const module = await createModuleWithEnv({ PAYMENT_MODE: 'mock', NODE_ENV: 'development' });
    const gateway = module.get<IPaymentGateway>(PAYMENT_GATEWAY);

    expect(gateway).toBeInstanceOf(MockPaymentGateway);
    expect(gateway.getMode()).toBe('mock');

    const res = await gateway.initiateVirtualAccount({
      orderId: 'test-order-1',
      orderNumber: 'ORD-123',
      totalAmount: 5000,
      customerEmail: 'customer@test.com',
      customerName: 'Adebayo Test',
      customerPhone: '08012345678',
      provider: PaymentProvider.MONNIFY,
      paymentReference: 'PAY-123',
    });

    expect(res.bankName).toBe('Wema Bank');
    expect(res.accountNumber).toMatch(/^78\d{8}$/);
  });

  it('should inject MonnifyPaymentGateway when profile is "production"', async () => {
    const module = await createModuleWithEnv({
      PAYMENT_MODE: 'production',
      NODE_ENV: 'production',
      MONNIFY_API_KEY: 'test_key',
      MONNIFY_SECRET_KEY: 'test_secret',
      MONNIFY_CONTRACT_CODE: '1234567890',
    });
    const gateway = module.get<IPaymentGateway>(PAYMENT_GATEWAY);

    expect(gateway).toBeInstanceOf(MonnifyPaymentGateway);
    expect(gateway.getMode()).toBe('production');
  });

  it('should verify signature safely in MockPaymentGateway', () => {
    const mock = new MockPaymentGateway();
    expect(mock.verifyWebhookSignature(PaymentProvider.MONNIFY, '{}', 'any_sig')).toBe(true);
  });
});
