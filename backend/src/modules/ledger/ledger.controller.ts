import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { ReconciliationService } from './reconciliation.service';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@dispatch/shared';

@Controller('ledger')
export class LedgerController {
  constructor(
    private readonly ledgerService: LedgerService,
    private readonly reconciliationService: ReconciliationService,
    private readonly walletService: WalletService,
  ) {}

  @Get('audit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async runAudit() {
    return this.reconciliationService.reconcile();
  }

  @Get('wallet/vendor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR_OWNER, UserRole.ADMIN)
  async getVendorWallet(@CurrentUser() user: any) {
    const walletId = await this.walletService.getVendorWalletId(user.sub);
    const balance = await this.ledgerService.getWalletBalance(walletId);
    const entries = await this.ledgerService.getEntriesForWallet(walletId, undefined, 50);
    return { ...balance, ...entries };
  }

  @Get('wallet/rider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RIDER, UserRole.ADMIN)
  async getRiderWallet(@CurrentUser() user: any) {
    const walletId = await this.walletService.getRiderWalletId(user.sub);
    const balance = await this.ledgerService.getWalletBalance(walletId);
    const entries = await this.ledgerService.getEntriesForWallet(walletId, undefined, 50);
    return { ...balance, ...entries };
  }

  @Get('wallet/:walletId/entries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getWalletEntries(@Param('walletId') walletId: string) {
    return this.ledgerService.getEntriesForWallet(walletId);
  }
}
