import { NotificationChannel } from '@dispatch/shared';

export const NOTIFICATION_GATEWAY = Symbol('NOTIFICATION_GATEWAY');

export interface SendNotificationParams {
  id?: string;
  channel: NotificationChannel;
  recipient: string;
  template: string;
  payload: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId: string;
  provider: string;
  rawResponse?: Record<string, any>;
}

export interface INotificationGateway {
  send(params: SendNotificationParams): Promise<NotificationResult>;
  getMode(): 'mock' | 'production';
}
