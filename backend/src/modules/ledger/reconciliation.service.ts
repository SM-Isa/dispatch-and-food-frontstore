import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface ReconciliationReport {
  checkedAt: Date;
  walletDrifts: Array<{
    walletId: string;
    storedBalance: string;
    computedBalance: string;
    drift: string;
  }>;
  unbalancedGroups: Array<{
    entryGroupId: string;
    net: string;
  }>;
  globalNet: string;
  stuckPayouts: Array<{
    payoutId: string;
    amount: string;
    status: string;
    initiatedAt: Date;
  }>;
  isHealthy: boolean;
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 2 * * *', { timeZone: 'Africa/Lagos' })
  async runNightlyReconciliation(): Promise<void> {
    const report = await this.reconcile();
    if (!report.isHealthy) {
      this.logger.error(
        `LEDGER RECONCILIATION FAILED — ${JSON.stringify(report)}`,
      );
    } else {
      this.logger.log('Ledger reconciliation OK');
    }
  }

  async reconcile(): Promise<ReconciliationReport> {
    const [walletDrifts, unbalancedGroups, globalNet, stuckPayouts] =
      await Promise.all([
        this.findWalletDrifts(),
        this.findUnbalancedGroups(),
        this.computeGlobalNet(),
        this.findStuckPayouts(),
      ]);

    return {
      checkedAt: new Date(),
      walletDrifts,
      unbalancedGroups,
      globalNet,
      stuckPayouts,
      isHealthy:
        walletDrifts.length === 0 &&
        unbalancedGroups.length === 0 &&
        globalNet === '0' &&
        stuckPayouts.length === 0,
    };
  }

  private async findWalletDrifts() {
    return this.prisma.$queryRaw<
      Array<{
        walletId: string;
        storedBalance: string;
        computedBalance: string;
        drift: string;
      }>
    >`
      SELECT
        w.id AS "walletId",
        w.balance::text AS "storedBalance",
        COALESCE(SUM(
          CASE le.direction WHEN 'CREDIT' THEN le.amount ELSE -le.amount END
        ), 0)::text AS "computedBalance",
        (w.balance - COALESCE(SUM(
          CASE le.direction WHEN 'CREDIT' THEN le.amount ELSE -le.amount END
        ), 0))::text AS "drift"
      FROM wallets w
      LEFT JOIN ledger_entries le ON le.wallet_id = w.id
      GROUP BY w.id, w.balance
      HAVING w.balance <> COALESCE(SUM(
        CASE le.direction WHEN 'CREDIT' THEN le.amount ELSE -le.amount END
      ), 0)
    `;
  }

  private async findUnbalancedGroups() {
    return this.prisma.$queryRaw<
      Array<{ entryGroupId: string; net: string }>
    >`
      SELECT
        entry_group_id AS "entryGroupId",
        SUM(CASE direction WHEN 'CREDIT' THEN amount ELSE -amount END)::text AS "net"
      FROM ledger_entries
      GROUP BY entry_group_id
      HAVING SUM(CASE direction WHEN 'CREDIT' THEN amount ELSE -amount END) <> 0
    `;
  }

  private async computeGlobalNet(): Promise<string> {
    const rows = await this.prisma.$queryRaw<Array<{ net: string }>>`
      SELECT COALESCE(
        SUM(CASE direction WHEN 'CREDIT' THEN amount ELSE -amount END), 0
      )::text AS net
      FROM ledger_entries
    `;
    return rows[0]?.net ?? '0';
  }

  private async findStuckPayouts() {
    return this.prisma.$queryRaw<
      Array<{
        payoutId: string;
        amount: string;
        status: string;
        initiatedAt: Date;
      }>
    >`
      SELECT
        id AS "payoutId",
        amount::text AS "amount",
        status::text AS "status",
        initiated_at AS "initiatedAt"
      FROM payouts
      WHERE status = 'PROCESSING'
        AND initiated_at < now() - interval '24 hours'
      LIMIT 100
    `;
  }
}
