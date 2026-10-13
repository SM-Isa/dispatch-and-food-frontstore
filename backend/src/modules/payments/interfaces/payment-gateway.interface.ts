import { PaymentProvider } from '@dispatch/shared';

export interface VirtualAccountDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  currency: string;
  expiresInMinutes: number;
  paymentReference: string;
  provider: PaymentProvider;
}

export interface InitiateVirtualAccountParams {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  paymentReference: string;
  provider: PaymentProvider;
}

export interface IPaymentGateway {
  /**
   * Generates or reserves a dynamic virtual account for bank transfer
   */
  initiateVirtualAccount(params: InitiateVirtualAccountParams): Promise<VirtualAccountDetails>;

  /**
   * Validates cryptographic webhook signature (e.g. SHA-512 for Monnify, SHA-256 for Korapay)
   */
  verifyWebhookSignature(provider: PaymentProvider, rawBody: string, signature: string): boolean;

  /**
   * Identifies the current active gateway mode
   */
  getMode(): 'mock' | 'production' | 'sandbox';
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
