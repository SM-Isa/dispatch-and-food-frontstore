import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { LedgerService } from '../ledger/ledger.service';
import { RequestPayoutDto } from './dto/payout.dto';
import { AccountCode, LedgerDirection, PayoutStatus, WalletType } from '@dispatch/shared';
import { randomUUID } from 'crypto';
import {
  IPayoutGateway,
  PAYOUT_GATEWAY,
} from './interfaces/payout-gateway.interface';
import { MockPayoutGateway } from './gateways/mock-payout.gateway';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);
  private readonly gateway: IPayoutGateway;

  constructor(
    private readonly db: DatabaseService,
    private readonly ledgerService: LedgerService,
    @Optional()
    @Inject(PAYOUT_GATEWAY)
    gateway?: IPayoutGateway,
  ) {
    this.gateway = gateway || new MockPayoutGateway();
  }

  async requestPayout(userId: string, dto: RequestPayoutDto) {
    return this.db.transaction(async (client) => {
      // 1. Fetch wallet
      const walletRes = await client.query(
        `SELECT * FROM wallets WHERE owner_id = $1 AND ledger_type IN ('VENDOR', 'RIDER') FOR UPDATE`,
        [userId],
      );
      const wallet = walletRes.rows[0];
      if (!wallet) {
        throw new NotFoundException('Payable wallet not found for this user');
      }

      const balance = parseFloat(wallet.balance);
      if (balance < dto.amount) {
        throw new BadRequestException(`Insufficient balance (${balance.toFixed(2)} NGN) for payout of ${dto.amount} NGN`);
      }

      // 2. Insert payout record
      const providerRef = `PO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const payoutRes = await client.query(
        `INSERT INTO payouts (
          wallet_id, amount, currency, status, provider,
          provider_ref, bank_code, account_number, account_name, initiated_by
        )
        VALUES ($1, $2, 'NGN', 'PENDING', $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          wallet.id,
          dto.amount,
          dto.provider || 'MONNIFY',
          providerRef,
          dto.bankCode,
          dto.accountNumber,
          dto.accountName,
          userId,
        ],
      );
      const payout = payoutRes.rows[0];

      // 3. Post balanced double-entry ledger pair
      const bankWallet = (
        await client.query(`SELECT id FROM wallets WHERE ledger_type = 'BANK_SETTLEMENT' LIMIT 1`)
      ).rows[0];

      const accountCode =
        wallet.ledger_type === WalletType.VENDOR
          ? AccountCode.VENDOR_PAYABLE
          : AccountCode.RIDER_PAYABLE;

      const entryGroupId = randomUUID();
      await this.ledgerService.postBalancedEntries(
        client,
        entryGroupId,
        `PAYOUT_${payout.id}`,
        [
          // Debit payable (decreases liability owed to vendor/rider)
          {
            walletId: wallet.id,
            accountCode,
            amount: dto.amount,
            direction: LedgerDirection.DEBIT,
            description: `Payout to bank account ${dto.accountNumber}`,
            payoutId: payout.id,
            idempotencySuffix: 'PAYABLE_DEBIT',
          },
          // Credit bank settlement (decreases bank cash asset)
          {
            walletId: bankWallet.id,
            accountCode: AccountCode.BANK_SETTLEMENT,
            amount: dto.amount,
            direction: LedgerDirection.CREDIT,
            description: `Bank transfer initiated via ${dto.provider || 'MONNIFY'}`,
            payoutId: payout.id,
            idempotencySuffix: 'BANK_CREDIT',
          },
        ],
      );

      // 4. Delegate bank transfer execution to active profile gateway (Mock vs Monnify Production)
      const payoutResult = await this.gateway.initiatePayout({
        payoutId: payout.id,
        amount: dto.amount,
        bankCode: dto.bankCode,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        narration: `Dispatch payout to ${dto.accountName}`,
        providerRef,
      });

      const finalStatus = payoutResult.status;
      const paidClause = finalStatus === 'PAID' ? ', paid_at = now()' : '';

      await client.query(
        `UPDATE payouts 
         SET status = $1, processed_at = now() ${paidClause}
         WHERE id = $2`,
        [finalStatus, payout.id],
      );

      this.logger.log(
        `Payout ${payout.id} processed via ${this.gateway.getMode()} [status=${finalStatus}, ref=${payoutResult.externalReference}]`,
      );

      return {
        ...payout,
        status: finalStatus,
        externalReference: payoutResult.externalReference,
        gatewayMode: this.gateway.getMode(),
      };
    });
  }

  async getPayoutHistory(userId: string) {
    return this.db.queryMany(
      `SELECT p.* 
       FROM payouts p
       JOIN wallets w ON w.id = p.wallet_id
       WHERE w.owner_id = $1
       ORDER BY p.initiated_at DESC`,
      [userId],
    );
  }
}
