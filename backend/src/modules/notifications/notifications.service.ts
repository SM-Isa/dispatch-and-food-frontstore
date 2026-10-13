import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { NotificationChannel } from '@dispatch/shared';
import {
  INotificationGateway,
  NOTIFICATION_GATEWAY,
} from './interfaces/notification-gateway.interface';
import { MockNotificationGateway } from './gateways/mock-notification.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly gateway: INotificationGateway;

  constructor(
    private readonly db: DatabaseService,
    @Optional()
    @Inject(NOTIFICATION_GATEWAY)
    gateway?: INotificationGateway,
  ) {
    this.gateway = gateway || new MockNotificationGateway();
  }

  /**
   * Enqueue a reliable outbox notification
   */
  async enqueue(
    channel: NotificationChannel,
    recipient: string,
    template: string,
    payload: Record<string, any>,
  ) {
    const row = await this.db.queryOne(
      `INSERT INTO notifications_outbox (channel, recipient, template, payload, status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING *`,
      [channel, recipient, template, JSON.stringify(payload)],
    );
    return row;
  }

  /**
   * Process a batch of pending notifications from the transactional outbox
   * Delegates dispatch to the active gateway profile (Mock vs Termii/FCM Production)
   */
  async processOutboxBatch(batchSize: number = 20) {
    const pending = await this.db.queryMany(
      `SELECT * FROM notifications_outbox
       WHERE status = 'PENDING' AND scheduled_at <= now() AND attempts < 3
       ORDER BY scheduled_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [batchSize],
    );

    if (pending.length === 0) return { processed: 0 };

    for (const item of pending) {
      try {
        const payload =
          typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;

        const result = await this.gateway.send({
          id: item.id,
          channel: item.channel,
          recipient: item.recipient,
          template: item.template,
          payload,
        });

        if (result.success) {
          await this.db.query(
            `UPDATE notifications_outbox
             SET status = 'SENT', sent_at = now(), attempts = attempts + 1
             WHERE id = $1`,
            [item.id],
          );
          this.logger.log(
            `Notification ${item.id} sent via ${this.gateway.getMode()} [msgId=${result.messageId}]`,
          );
        } else {
          await this.db.query(
            `UPDATE notifications_outbox
             SET status = 'FAILED', last_error = $1, attempts = attempts + 1
             WHERE id = $2`,
            ['Gateway delivery reported failure', item.id],
          );
        }
      } catch (err) {
        this.logger.error(`Failed to send notification ${item.id}: ${(err as Error).message}`);
        await this.db.query(
          `UPDATE notifications_outbox
           SET status = 'FAILED', last_error = $1, attempts = attempts + 1
           WHERE id = $2`,
          [(err as Error).message, item.id],
        );
      }
    }

    return { processed: pending.length };
  }
}
