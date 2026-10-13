import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationGateway,
  SendNotificationParams,
  NotificationResult,
} from '../interfaces/notification-gateway.interface';

@Injectable()
export class MockNotificationGateway implements INotificationGateway {
  private readonly logger = new Logger(MockNotificationGateway.name);
  private sentHistory: SendNotificationParams[] = [];

  async send(params: SendNotificationParams): Promise<NotificationResult> {
    this.logger.debug(
      `[MOCK NOTIFICATION GATEWAY] Simulated ${params.channel} to ${params.recipient} [Template: ${params.template}]`,
    );

    this.sentHistory.push(params);

    return {
      success: true,
      messageId: `sim_msg_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      provider: 'MOCK',
      rawResponse: { simulated: true },
    };
  }

  getHistory(): SendNotificationParams[] {
    return [...this.sentHistory];
  }

  clearHistory(): void {
    this.sentHistory = [];
  }

  getMode(): 'mock' {
    return 'mock';
  }
}
