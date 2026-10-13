import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { AuthModule } from '../auth/auth.module';
import { MockPaymentGateway } from './gateways/mock-payment.gateway';
import { MonnifyPaymentGateway } from './gateways/monnify-payment.gateway';
import { PAYMENT_GATEWAY } from './interfaces/payment-gateway.interface';

@Module({
  imports: [ConfigModule, LedgerModule, AuthModule],
  controllers: [PaymentsController],
  providers: [
    MockPaymentGateway,
    MonnifyPaymentGateway,
    {
      provide: PAYMENT_GATEWAY,
      useFactory: (
        config: ConfigService,
        mockGateway: MockPaymentGateway,
        monnifyGateway: MonnifyPaymentGateway,
      ) => {
        // Equivalent to Spring Boot active profiles (e.g. @Profile("mock") vs @Profile("prod")):
        // 1. Explicit override via PAYMENT_MODE ('mock' | 'production' | 'sandbox' | 'monnify')
        // 2. Or NODE_ENV ('production' -> MonnifyPaymentGateway, otherwise -> MockPaymentGateway)
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
    PaymentsService,
  ],
  exports: [PaymentsService, PAYMENT_GATEWAY],
})
export class PaymentsModule {}
