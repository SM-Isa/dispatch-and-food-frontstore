import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { LedgerService } from './ledger.service';
import { LedgerRepository } from './ledger.repository';
import { WalletService } from './wallet.service';
import { ReconciliationService } from './reconciliation.service';
import { LedgerController } from './ledger.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [LedgerController],
  providers: [
    LedgerService,
    LedgerRepository,
    WalletService,
    ReconciliationService,
  ],
  exports: [
    LedgerService,
    WalletService,
    ReconciliationService,
  ],
})
export class LedgerModule {}
