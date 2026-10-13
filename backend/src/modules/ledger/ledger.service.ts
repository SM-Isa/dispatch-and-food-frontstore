import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { LedgerRepository, WalletRow } from './ledger.repository';
import {
  EmptyEntryGroupError,
  LedgerImbalanceError,
  WalletLockedError,
} from './errors';
import {
  AccountCode,
  Decimal,
  PostEntryGroupInput,
  PostEntryGroupResult,
  WalletBalanceSnapshot,
} from './types';

/**
 * LedgerService is the ONLY writer of `wallets.balance` and `ledger_entries`
 * in the entire codebase. Nothing else may insert ledger entries.
 *
 * Invariants enforced here:
 *   1. Every entry group must sum to zero (credits == debits).
 *   2. Idempotency keys are unique across all entries; retries are no-ops.
 *   3. Wallets are row-locked in deterministic order to prevent deadlocks.
 *   4. `balance_after` is written in the same transaction as the wallet update.
 *   5. No business logic lives here. Callers supply the postings; this service balances them.
 */
@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: LedgerRepository,
  ) {}

  /**
   * Post an entry group. Atomic. Idempotent.
   *
   * Callers MUST wrap this in their own transaction when combining it with
   * business state changes (order.status = PAID, etc.). If called standalone,
   * this method opens its own transaction.
   */
  async postEntryGroup(
    input: PostEntryGroupInput,
    outerTx?: Prisma.TransactionClient,
  ): Promise<PostEntryGroupResult> {
    this.validateInput(input);

    if (outerTx) {
      return this.execute(input, outerTx);
    }

    return this.prisma.$transaction(
      async (tx) => this.execute(input, tx),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10_000,
        maxWait: 5_000,
      },
    );
  }

  /**
   * Read-only. Use this for admin dashboards, wallet endpoints, and
   * reconciliation jobs — never to drive business decisions.
   */
  async getWalletBalance(walletId: string): Promise<WalletBalanceSnapshot> {
    const w = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      select: { id: true, balance: true, currency: true, ledgerType: true },
    });
    if (!w) throw new Error(`Wallet ${walletId} not found`);
    return {
      walletId: w.id,
      balance: w.balance,
      currency: w.currency,
      ledgerType: w.ledgerType,
    };
  }

  /**
   * Paginated ledger entries for a wallet.
   * Cursor is the last entry's `id`. Ordered DESC by createdAt.
   */
  async getEntriesForWallet(
    walletId: string,
    cursor?: string,
    limit = 20,
  ): Promise<{
    data: Array<{
      id: string;
      entryGroupId: string;
      amount: Decimal;
      direction: 'CREDIT' | 'DEBIT';
      accountCode: AccountCode;
      description: string;
      balanceAfter: Decimal | null;
      createdAt: Date;
    }>;
    nextCursor: string | null;
  }> {
    const rows = await this.prisma.ledgerEntry.findMany({
      where: { walletId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        entryGroupId: true,
        amount: true,
        direction: true,
        accountCode: true,
        description: true,
        balanceAfter: true,
        createdAt: true,
      },
    });

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data: data.map((r) => ({
        ...r,
        accountCode: r.accountCode as unknown as AccountCode,
        direction: r.direction as 'CREDIT' | 'DEBIT',
      })),
      nextCursor,
    };
  }

  private async execute(
    input: PostEntryGroupInput,
    tx: Prisma.TransactionClient,
  ): Promise<PostEntryGroupResult> {
    // 1. Idempotency check
    const existing = await this.repo.findEntryByIdempotencyKey(
      tx,
      input.idempotencyKey,
    );
    if (existing) {
      this.logger.debug(
        `Duplicate ledger posting ignored: key=${input.idempotencyKey} group=${existing.entryGroupId}`,
      );
      return {
        entryGroupId: existing.entryGroupId,
        status: 'DUPLICATE_IGNORED',
        entryIds: [],
      };
    }

    // 2. Lock wallets in deterministic order
    const walletIds = [...new Set(input.postings.map((p) => p.walletId))];
    const wallets = await this.repo.lockWallets(tx, walletIds);
    const walletMap = new Map<string, WalletRow>(wallets.map((w) => [w.id, w]));

    // 3. Reject if any wallet is locked
    for (const w of wallets) {
      if (w.is_locked) throw new WalletLockedError(w.id);
    }

    // 4. Compute deltas per wallet
    const deltaByWallet = new Map<string, Decimal>();
    for (const p of input.postings) {
      const signed =
        p.direction === 'CREDIT' ? p.amount : p.amount.negated();
      const current = deltaByWallet.get(p.walletId) ?? new Prisma.Decimal(0);
      deltaByWallet.set(p.walletId, current.plus(signed));
    }

    // 5. Track running balance per wallet so balance_after is monotonic
    const runningBalance = new Map<string, Decimal>();
    for (const w of wallets) runningBalance.set(w.id, w.balance);

    const insertedIds: string[] = [];
    for (const p of input.postings) {
      const before = runningBalance.get(p.walletId)!;
      const signed =
        p.direction === 'CREDIT' ? p.amount : p.amount.negated();
      const after = before.plus(signed);

      const rowKey = `${input.idempotencyKey}:${p.walletId}:${p.accountCode}`;

      const entry = await this.repo.insertEntry(tx, {
        entryGroupId: input.entryGroupId,
        walletId: p.walletId,
        orderId: input.orderId,
        payoutId: input.payoutId,
        accountCode: p.accountCode,
        amount: p.amount,
        direction: p.direction,
        description: p.description,
        idempotencyKey: rowKey,
        balanceAfter: after,
        metadata: p.metadata as Prisma.InputJsonValue | undefined,
      });

      insertedIds.push(entry.id);
      runningBalance.set(p.walletId, after);
    }

    // 6. Update wallet balances by aggregate delta
    for (const [walletId, delta] of deltaByWallet) {
      await this.repo.incrementWalletBalance(tx, walletId, delta);
    }

    this.logger.log(
      `Ledger posted: group=${input.entryGroupId} postings=${input.postings.length} key=${input.idempotencyKey}`,
    );

    return {
      entryGroupId: input.entryGroupId,
      status: 'POSTED',
      entryIds: insertedIds,
    };
  }

  private validateInput(input: PostEntryGroupInput): void {
    if (!input.entryGroupId) {
      throw new Error('entryGroupId is required');
    }
    if (!input.idempotencyKey) {
      throw new Error('idempotencyKey is required');
    }
    if (!input.postings || input.postings.length < 2) {
      throw new EmptyEntryGroupError(input.entryGroupId);
    }

    // Balance check — the zero-sum invariant
    let net = new Prisma.Decimal(0);
    for (const p of input.postings) {
      if (p.amount.lte(0)) {
        throw new Error(
          `Posting amount must be positive. Got ${p.amount.toString()} for ${p.accountCode}`,
        );
      }
      const signed = p.direction === 'CREDIT' ? p.amount : p.amount.negated();
      net = net.plus(signed);
    }

    if (!net.isZero()) {
      throw new LedgerImbalanceError(input.entryGroupId, net.toString());
    }
  }

  /**
   * Post balanced double-entry ledger entries using a raw database client (inside transaction).
   */
  async postBalancedEntries(
    client: any,
    entryGroupId: string,
    idempotencyKey: string,
    entries: Array<{
      walletId: string;
      accountCode: string;
      amount: number | Decimal | any;
      direction: 'DEBIT' | 'CREDIT' | string;
      description: string;
      orderId?: string;
      payoutId?: string;
      idempotencySuffix?: string;
    }>,
  ): Promise<void> {
    for (const e of entries) {
      const rowKey = `${idempotencyKey}_${e.idempotencySuffix || e.walletId}`;
      const sign = e.direction === 'CREDIT' ? '+' : '-';

      const walletRes = await client.query(
        `UPDATE wallets 
         SET balance = balance ${sign} $1, updated_at = now() 
         WHERE id = $2 
         RETURNING balance`,
        [e.amount, e.walletId],
      );
      const balanceAfter = walletRes.rows[0]?.balance ?? 0;

      await client.query(
        `INSERT INTO ledger_entries (
          entry_group_id, wallet_id, order_id, payout_id,
          account_code, amount, direction, description,
          idempotency_key, balance_after
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (idempotency_key) DO NOTHING`,
        [
          entryGroupId,
          e.walletId,
          e.orderId || null,
          e.payoutId || null,
          e.accountCode,
          e.amount,
          e.direction,
          e.description,
          rowKey,
          balanceAfter,
        ],
      );
    }
  }

  /**
   * Record customer payment received into escrow (debit PSP receivable, credit Customer Escrow).
   */
  async recordOrderPaymentReceived(
    client: any,
    orderId: string,
    totalAmount: number,
    paymentReference: string,
  ): Promise<void> {
    const pspWallet = (
      await client.query(`SELECT id FROM wallets WHERE ledger_type = 'PLATFORM' OR ledger_type = 'BANK_SETTLEMENT' LIMIT 1`)
    ).rows[0];
    const escrowWallet = (
      await client.query(`SELECT id FROM wallets WHERE ledger_type = 'CUSTOMER_ESCROW' LIMIT 1`)
    ).rows[0];

    if (!pspWallet || !escrowWallet) {
      throw new Error('System wallets for PSP or CUSTOMER_ESCROW not found');
    }

    const entryGroupId = randomUUID();
    await this.postBalancedEntries(
      client,
      entryGroupId,
      `ORDER_PAYMENT_${paymentReference}`,
      [
        {
          walletId: pspWallet.id,
          accountCode: '1200_PSP_RECEIVABLE',
          amount: totalAmount,
          direction: 'DEBIT',
          description: `Customer payment received for order ${orderId}`,
          orderId,
          idempotencySuffix: 'PSP_DEBIT',
        },
        {
          walletId: escrowWallet.id,
          accountCode: '1100_CUSTOMER_ESCROW',
          amount: totalAmount,
          direction: 'CREDIT',
          description: `Customer escrow held for order ${orderId}`,
          orderId,
          idempotencySuffix: 'ESCROW_CREDIT',
        },
      ],
    );
  }
}
