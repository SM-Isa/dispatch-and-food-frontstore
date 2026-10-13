export enum AccountCode {
  CUSTOMER_ESCROW = '1100_CUSTOMER_ESCROW',
  PSP_RECEIVABLE = '1200_PSP_RECEIVABLE',
  VENDOR_PAYABLE = '2000_VENDOR_PAYABLE',
  RIDER_PAYABLE = '2100_RIDER_PAYABLE',
  PLATFORM_REVENUE = '2200_PLATFORM_REVENUE',
  CUSTOMER_REFUND_PAYABLE = '2300_CUSTOMER_REFUND_PAYABLE',
  PLATFORM_LOSS = '2400_PLATFORM_LOSS',
  PAYOUT_IN_TRANSIT = '2500_PAYOUT_IN_TRANSIT',
  BANK_SETTLEMENT = '3000_BANK_SETTLEMENT',
}

export interface ChartOfAccountDefinition {
  code: AccountCode;
  name: string;
  normalBalance: 'DEBIT' | 'CREDIT';
  isPlatformOwned: boolean;
  description: string;
}

export const CHART_OF_ACCOUNTS: Record<AccountCode, ChartOfAccountDefinition> = {
  [AccountCode.CUSTOMER_ESCROW]: {
    code: AccountCode.CUSTOMER_ESCROW,
    name: 'Customer Escrow',
    normalBalance: 'DEBIT',
    isPlatformOwned: true,
    description: 'Money received from customer, held until vendor & rider delivery confirmed',
  },
  [AccountCode.PSP_RECEIVABLE]: {
    code: AccountCode.PSP_RECEIVABLE,
    name: 'PSP Receivable',
    normalBalance: 'DEBIT',
    isPlatformOwned: true,
    description: 'In-flight funds from payment providers (Monnify / Korapay)',
  },
  [AccountCode.VENDOR_PAYABLE]: {
    code: AccountCode.VENDOR_PAYABLE,
    name: 'Vendor Payable',
    normalBalance: 'CREDIT',
    isPlatformOwned: false,
    description: 'Net food sales owed to vendors post-commission deduction',
  },
  [AccountCode.RIDER_PAYABLE]: {
    code: AccountCode.RIDER_PAYABLE,
    name: 'Rider Payable',
    normalBalance: 'CREDIT',
    isPlatformOwned: false,
    description: 'Delivery earnings owed to individual riders or reserved in the rider pool',
  },
  [AccountCode.PLATFORM_REVENUE]: {
    code: AccountCode.PLATFORM_REVENUE,
    name: 'Platform Commission Revenue',
    normalBalance: 'CREDIT',
    isPlatformOwned: true,
    description: 'Commission earned by platform from vendor food items + delivery splits',
  },
  [AccountCode.CUSTOMER_REFUND_PAYABLE]: {
    code: AccountCode.CUSTOMER_REFUND_PAYABLE,
    name: 'Customer Refund Payable',
    normalBalance: 'CREDIT',
    isPlatformOwned: true,
    description: 'Refunds owed to customers upon order cancellation or failed fulfillment',
  },
  [AccountCode.PLATFORM_LOSS]: {
    code: AccountCode.PLATFORM_LOSS,
    name: 'Platform Loss',
    normalBalance: 'DEBIT',
    isPlatformOwned: true,
    description: 'Losses absorbed by platform for post-delivery dispute refunds',
  },
  [AccountCode.PAYOUT_IN_TRANSIT]: {
    code: AccountCode.PAYOUT_IN_TRANSIT,
    name: 'Payout In Transit',
    normalBalance: 'CREDIT',
    isPlatformOwned: true,
    description: 'Payouts dispatched to payment gateway / bank but not yet confirmed settled',
  },
  [AccountCode.BANK_SETTLEMENT]: {
    code: AccountCode.BANK_SETTLEMENT,
    name: 'Bank Settlement',
    normalBalance: 'DEBIT',
    isPlatformOwned: true,
    description: 'Actual settled cash balance residing in commercial bank accounts',
  },
};
