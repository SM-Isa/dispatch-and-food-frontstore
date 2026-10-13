import { Injectable } from '@nestjs/common';
import { Prisma, LedgerEntry } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WalletNotFoundError } from './errors';

export interface WalletRow {
  id: string;
  balance: Prisma.Decimal;
  currency: string;
  ledger_type: string;
  is_locked: boolean;
}

export interface InsertEntryRow {
  entryGroupId: string;
  walletId: string;
  orderId?: string;
  payoutId?: string;
  accountCode: string;
  amount: Prisma.Decimal;
  direction: 'CREDIT' | 'DEBIT';
  description: string;
  idempotencyKey: string;
  balanceAfter: Prisma.Decimal;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class LedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Row-lock wallets in deterministic order (sorted by ID) to prevent deadlocks.
   * Must be called inside a Prisma interactive transaction.
   */
  async lockWallets(
    tx: Prisma.TransactionClient,
    walletIds: string[],
  ): Promise<WalletRow[]> {
    if (walletIds.length === 0) return [];
    const sorted = [...new Set(walletIds)].sort();

    const rows = await tx.$queryRaw<WalletRow[]>`
      SELECT id, balance, currency, ledger_type, is_locked
      FROM wallets
      WHERE id = ANY(${sorted}::uuid[])
      ORDER BY id
      FOR UPDATE
    `;

    if (rows.length !== sorted.length) {
      const found = new Set(rows.map((r) => r.id));
      const missing = sorted.filter((id) => !found.has(id));
      throw new WalletNotFoundError(missing[0]);
    }

    return rows;
  }

  async findEntryByIdempotencyKey(
    tx: Prisma.TransactionClient,
    idempotencyKey: string,
  ): Promise<{ entryGroupId: string } | null> {
    const row = await tx.ledgerEntry.findFirst({
      where: { idempotencyKey },
      select: { entryGroupId: true },
    });
    return row;
  }

  async insertEntry(
    tx: Prisma.TransactionClient,
    row: InsertEntryRow,
  ): Promise<LedgerEntry> {
    return tx.ledgerEntry.create({
      data: {
        entryGroupId: row.entryGroupId,
        walletId: row.walletId,
        orderId: row.orderId,
        payoutId: row.payoutId,
        accountCode: row.accountCode as any,
        amount: row.amount,
        direction: row.direction,
        description: row.description,
        idempotencyKey: row.idempotencyKey,
        balanceAfter: row.balanceAfter,
        metadata: row.metadata ?? {},
      },
    });
  }

  async incrementWalletBalance(
    tx: Prisma.TransactionClient,
    walletId: string,
    delta: Prisma.Decimal,
  ): Promise<void> {
    await tx.wallet.update({
      where: { id: walletId },
      data: {
        balance: { increment: delta },
        updatedAt: new Date(),
      },
    });
  }

  async getWalletBalance(
    tx: Prisma.TransactionClient,
    walletId: string,
  ): Promise<Prisma.Decimal> {
    const row = await tx.wallet.findUnique({
      where: { id: walletId },
      select: { balance: true },
    });
    if (!row) throw new WalletNotFoundError(walletId);
    return row.balance;
  }
}
