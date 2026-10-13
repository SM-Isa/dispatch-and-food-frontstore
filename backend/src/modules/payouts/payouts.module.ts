import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PayoutsService } from './payouts.service';
import { PayoutsController } from './payouts.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { AuthModule } from '../auth/auth.module';
import { MockPayoutGateway } from './gateways/mock-payout.gateway';
import { MonnifyPayoutGateway } from './gateways/monnify-payout.gateway';
import { PAYOUT_GATEWAY } from './interfaces/payout-gateway.interface';

@Module({
  imports: [ConfigModule, LedgerModule, AuthModule],
  controllers: [PayoutsController],
  providers: [
    MockPayoutGateway,
    MonnifyPayoutGateway,
    {
      provide: PAYOUT_GATEWAY,
      useFactory: (
        config: ConfigService,
        mockGateway: MockPayoutGateway,
        monnifyGateway: MonnifyPayoutGateway,
      ) => {
        // Equivalent to Spring Boot active profiles (@Profile("mock") vs @Profile("prod")):
        // 1. Explicit override via PAYOUT_MODE ('mock' | 'production' | 'monnify')
        // 2. Or NODE_ENV ('production' -> MonnifyPayoutGateway, otherwise -> MockPayoutGateway)
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
    PayoutsService,
  ],
  exports: [PayoutsService, PAYOUT_GATEWAY],
})
export class PayoutsModule {}
