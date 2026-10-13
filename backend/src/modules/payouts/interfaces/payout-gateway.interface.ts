export const PAYOUT_GATEWAY = Symbol('PAYOUT_GATEWAY');

export interface InitiatePayoutParams {
  payoutId: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  narration: string;
  providerRef: string;
}

export interface PayoutResult {
  success: boolean;
  status: 'PAID' | 'PENDING' | 'FAILED';
  externalReference: string;
  fee?: number;
  message?: string;
  rawResponse?: Record<string, any>;
}

export interface IPayoutGateway {
  initiatePayout(params: InitiatePayoutParams): Promise<PayoutResult>;
  getMode(): 'mock' | 'production';
}
