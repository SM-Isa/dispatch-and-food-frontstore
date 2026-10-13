import { AccountCode } from './types';

export const ACCOUNT_META: Record<
  AccountCode,
  {
    normalSide: 'CREDIT' | 'DEBIT';
    isPlatformOwned: boolean;
    description: string;
  }
> = {
  [AccountCode.CUSTOMER_ESCROW]: {
    normalSide: 'DEBIT',
    isPlatformOwned: true,
    description: 'Cash received but not yet earned. Contraliability to escrow.',
  },
  [AccountCode.PSP_RECEIVABLE]: {
    normalSide: 'DEBIT',
    isPlatformOwned: true,
    description: 'In-flight funds between PSP and settlement bank.',
  },
  [AccountCode.VENDOR_PAYABLE]: {
    normalSide: 'CREDIT',
    isPlatformOwned: false,
    description: 'Amount owed to a specific vendor.',
  },
  [AccountCode.RIDER_PAYABLE]: {
    normalSide: 'CREDIT',
    isPlatformOwned: false,
    description: 'Amount owed to a specific rider (or to the rider pool).',
  },
  [AccountCode.PLATFORM_REVENUE]: {
    normalSide: 'CREDIT',
    isPlatformOwned: true,
    description: 'Commission and fees earned by the platform.',
  },
  [AccountCode.REFUND_PAYABLE]: {
    normalSide: 'CREDIT',
    isPlatformOwned: true,
    description: 'Refunds owed to customers but not yet settled.',
  },
  [AccountCode.PLATFORM_LOSS]: {
    normalSide: 'DEBIT',
    isPlatformOwned: true,
    description: 'Losses absorbed by platform (post-delivery disputes).',
  },
  [AccountCode.PAYOUT_IN_TRANSIT]: {
    normalSide: 'CREDIT',
    isPlatformOwned: true,
    description: 'Payouts dispatched to PSP but not yet confirmed settled.',
  },
  [AccountCode.BANK_SETTLEMENT]: {
    normalSide: 'DEBIT',
    isPlatformOwned: true,
    description: 'Cash actually received in the settlement bank account.',
  },
};
