import { Injectable, Logger } from '@nestjs/common';
import {
  IPaymentGateway,
  InitiateVirtualAccountParams,
  VirtualAccountDetails,
} from '../interfaces/payment-gateway.interface';
import { PaymentProvider } from '@dispatch/shared';

@Injectable()
export class MockPaymentGateway implements IPaymentGateway {
  private readonly logger = new Logger(MockPaymentGateway.name);

  async initiateVirtualAccount(params: InitiateVirtualAccountParams): Promise<VirtualAccountDetails> {
    this.logger.debug(
      `[MOCK PAYMENT GATEWAY] Generating synthetic virtual account for Order ${params.orderNumber} (₦${params.totalAmount})`,
    );

    const bankName =
      params.provider === PaymentProvider.MONNIFY ? 'Wema Bank' : 'Providus Bank';
    const accountNumber = `78${Math.floor(10000000 + Math.random() * 90000000)}`;

    return {
      bankName,
      accountNumber,
      accountName: `Dispatch/${params.orderNumber}`,
      amount: params.totalAmount,
      currency: 'NGN',
      expiresInMinutes: 30,
      paymentReference: params.paymentReference,
      provider: params.provider,
    };
  }

  verifyWebhookSignature(provider: PaymentProvider, rawBody: string, signature: string): boolean {
    this.logger.debug(
      `[MOCK PAYMENT GATEWAY] Webhook signature bypassed in MOCK mode for ${provider}`,
    );
    return true;
  }

  getMode(): 'mock' {
    return 'mock';
  }
}
