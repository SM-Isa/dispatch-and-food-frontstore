import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPayoutGateway,
  InitiatePayoutParams,
  PayoutResult,
} from '../interfaces/payout-gateway.interface';

@Injectable()
export class MonnifyPayoutGateway implements IPayoutGateway {
  private readonly logger = new Logger(MonnifyPayoutGateway.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly walletAccountNumber: string;

  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly config: ConfigService) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    this.baseUrl = this.config.get<string>(
      'MONNIFY_BASE_URL',
      isProd ? 'https://api.monnify.com' : 'https://sandbox.monnify.com',
    );
    this.apiKey = this.config.get<string>('MONNIFY_API_KEY', '');
    this.secretKey = this.config.get<string>('MONNIFY_SECRET_KEY', '');
    this.walletAccountNumber = this.config.get<string>('MONNIFY_DISBURSEMENT_ACCOUNT', '');
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.cachedToken;
    }

    const credentials = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errBody = await response.text();
      this.logger.error(`Failed to authenticate with Monnify API: ${errBody}`);
      throw new Error(`Monnify OAuth failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      responseBody: { accessToken: string; expiresIn: number };
    };
    this.cachedToken = data.responseBody.accessToken;
    this.tokenExpiresAt = Date.now() + data.responseBody.expiresIn * 1000;
    return this.cachedToken;
  }

  async initiatePayout(params: InitiatePayoutParams): Promise<PayoutResult> {
    this.logger.log(
      `[MONNIFY PAYOUT GATEWAY] Disbursing ₦${params.amount} to ${params.accountNumber} (Bank: ${params.bankCode}) via ${this.baseUrl}`,
    );

    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/api/v2/disbursements/single`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        reference: params.providerRef,
        narration: params.narration || `Dispatch Payout ${params.providerRef}`,
        destinationBankCode: params.bankCode,
        destinationAccountNumber: params.accountNumber,
        currency: 'NGN',
        sourceAccountNumber: this.walletAccountNumber,
        async: false,
      }),
    });

    const data = (await response.json()) as {
      requestSuccessful: boolean;
      responseMessage: string;
      responseCode: string;
      responseBody?: {
        reference: string;
        transactionReference: string;
        amount: number;
        fee: number;
        status: string;
        destinationBankCode: string;
        destinationAccountNumber: string;
      };
    };

    if (!response.ok || !data.requestSuccessful) {
      this.logger.error(
        `Monnify disbursement failed: code=${data.responseCode} msg=${data.responseMessage}`,
      );
      return {
        success: false,
        status: 'FAILED',
        externalReference: params.providerRef,
        message: data.responseMessage || 'Disbursement request failed',
        rawResponse: data,
      };
    }

    const rawStatus = (data.responseBody?.status || '').toUpperCase();
    let status: 'PAID' | 'PENDING' | 'FAILED' = 'PENDING';
    if (rawStatus === 'SUCCESSFUL' || rawStatus === 'PAID') {
      status = 'PAID';
    } else if (rawStatus === 'FAILED') {
      status = 'FAILED';
    }

    return {
      success: status !== 'FAILED',
      status,
      externalReference: data.responseBody?.transactionReference || params.providerRef,
      fee: data.responseBody?.fee,
      message: data.responseMessage,
      rawResponse: data,
    };
  }

  getMode(): 'production' {
    return 'production';
  }
}
