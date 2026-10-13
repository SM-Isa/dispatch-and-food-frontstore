import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { OfferLockService } from './offer-lock.service';
import { RiderPresenceService } from '../riders/rider-presence.service';
import { DispatchRepository } from './dispatch.repository';
import { DispatchEmitter } from './events/dispatch-emitter.service';
import { DispatchResponse } from '@prisma/client';

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    private readonly offerLock: OfferLockService,
    private readonly presence: RiderPresenceService,
    private readonly repo: DispatchRepository,
    private readonly emitter: DispatchEmitter,
  ) {}

  /**
   * Rider accepts an offer.
   * Single-winner guarantee resolved in Redis before touching Postgres.
   */
  async acceptOffer(
    deliveryId: string,
    offerId: string,
    riderId: string,
  ) {
    const isLive = await this.offerLock.isOfferLive(offerId);
    if (!isLive) {
      throw new ConflictException('Offer has already expired or been cancelled');
    }

    // Atomically claim winner in Redis
    const wonRace = await this.offerLock.claimOffer(offerId, riderId);
    if (!wonRace) {
      const winner = await this.offerLock.getWinner(offerId);
      throw new ConflictException(`Offer was claimed by another rider (${winner})`);
    }

    // Winner confirmed — commit assignment to Postgres
    const delivery = await this.repo.assignRider(deliveryId, riderId);

    // Update dispatch attempt record
    await this.repo.markOfferResponse(
      deliveryId,
      riderId,
      DispatchResponse.ACCEPTED,
    );

    // Mark rider busy so no concurrent offers arrive
    await this.presence.markBusy(riderId, deliveryId);

    // Release current active offer key
    await this.presence.releaseOffer(riderId, offerId);

    // Emit acceptance event
    await this.emitter.emitOfferAccepted(deliveryId, riderId);

    return {
      status: 'ACCEPTED',
      deliveryId: delivery.id,
      orderId: delivery.orderId,
    };
  }

  /**
   * Rider explicitly rejects an offer.
   */
  async rejectOffer(
    deliveryId: string,
    offerId: string,
    riderId: string,
  ) {
    await this.repo.markOfferResponse(
      deliveryId,
      riderId,
      DispatchResponse.REJECTED,
    );

    // Release offer lock so rider is immediately eligible for other orders
    await this.presence.releaseOffer(riderId, offerId);
    await this.offerLock.cancelOffer(offerId);

    this.logger.log(`Rider ${riderId} rejected delivery ${deliveryId}`);

    return { status: 'REJECTED' };
  }
}
