import { Prisma } from '@prisma/client';

export type Decimal = Prisma.Decimal;

export enum AccountCode {
  CUSTOMER_ESCROW   = 'CUSTOMER_ESCROW',
  PSP_RECEIVABLE    = 'PSP_RECEIVABLE',
  VENDOR_PAYABLE    = 'VENDOR_PAYABLE',
  RIDER_PAYABLE     = 'RIDER_PAYABLE',
  PLATFORM_REVENUE  = 'PLATFORM_REVENUE',
  REFUND_PAYABLE    = 'REFUND_PAYABLE',
  PLATFORM_LOSS     = 'PLATFORM_LOSS',
  PAYOUT_IN_TRANSIT = 'PAYOUT_IN_TRANSIT',
  BANK_SETTLEMENT   = 'BANK_SETTLEMENT',
}

export type LedgerDirection = 'CREDIT' | 'DEBIT';

export interface LedgerPosting {
  walletId: string;
  accountCode: AccountCode;
  amount: Decimal;
  direction: LedgerDirection;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface PostEntryGroupInput {
  entryGroupId: string;
  idempotencyKey: string;
  orderId?: string;
  payoutId?: string;
  postings: LedgerPosting[];
}

export interface PostEntryGroupResult {
  entryGroupId: string;
  status: 'POSTED' | 'DUPLICATE_IGNORED';
  entryIds: string[];
}

export interface WalletBalanceSnapshot {
  walletId: string;
  balance: Decimal;
  currency: string;
  ledgerType: string;
}
