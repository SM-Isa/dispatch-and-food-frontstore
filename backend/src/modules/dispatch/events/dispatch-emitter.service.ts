import { Injectable, Logger } from '@nestjs/common';
import { DispatchEventType, DispatchOfferEvent } from './dispatch-events';
import { PrismaService } from '../../../infra/prisma/prisma.service';

@Injectable()
export class DispatchEmitter {
  private readonly logger = new Logger(DispatchEmitter.name);

  constructor(private readonly prisma: PrismaService) {}

  async emitOfferCreated(event: DispatchOfferEvent): Promise<void> {
    this.logger.log(`Dispatch offer created for rider ${event.riderId} (Delivery: ${event.deliveryId})`);

    // Queue push notification in transactional outbox
    await this.prisma.notificationOutbox.create({
      data: {
        channel: 'PUSH',
        recipient: event.riderId,
        template: 'RIDER_DISPATCH_OFFER',
        payload: {
          offerId: event.offerId,
          deliveryId: event.deliveryId,
          orderNumber: event.orderNumber,
          pickupAddress: event.pickupAddress,
          dropoffAddress: event.dropoffAddress,
          distanceMeters: event.distanceMeters,
          expiresAt: event.expiresAt.toISOString(),
          round: event.round,
        },
      },
    });
  }

  async emitOfferAccepted(deliveryId: string, riderId: string): Promise<void> {
    this.logger.log(`Dispatch offer accepted: Delivery ${deliveryId} by rider ${riderId}`);
  }

  async emitDispatchEscalated(deliveryId: string, nextRound: number): Promise<void> {
    this.logger.warn(`Dispatch escalated: Delivery ${deliveryId} advancing to Round ${nextRound}`);
  }

  async emitDispatchFailed(deliveryId: string): Promise<void> {
    this.logger.error(`Dispatch failed after all rounds for Delivery ${deliveryId}. Needs manual ops!`);
  }
}
