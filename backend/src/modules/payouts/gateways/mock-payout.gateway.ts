import { Injectable, Logger } from '@nestjs/common';
import {
  IPayoutGateway,
  InitiatePayoutParams,
  PayoutResult,
} from '../interfaces/payout-gateway.interface';

@Injectable()
export class MockPayoutGateway implements IPayoutGateway {
  private readonly logger = new Logger(MockPayoutGateway.name);

  async initiatePayout(params: InitiatePayoutParams): Promise<PayoutResult> {
    this.logger.debug(
      `[MOCK PAYOUT GATEWAY] Simulating instant NIP settlement of ₦${params.amount} to ${params.accountNumber} (${params.accountName}, Bank: ${params.bankCode})`,
    );

    return {
      success: true,
      status: 'PAID',
      externalReference: `SIM_NIP_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      fee: 25.0, // Standard simulated NIP transfer fee (₦25)
      message: 'Simulated payout completed successfully',
      rawResponse: {
        responseCode: '0',
        responseMessage: 'success',
        simulated: true,
      },
    };
  }

  getMode(): 'mock' {
    return 'mock';
  }
}
