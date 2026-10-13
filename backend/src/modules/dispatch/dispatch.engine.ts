import { Injectable, Logger } from '@nestjs/common';
import { DeliveryStatus, DispatchResponse } from '@prisma/client';
import { CandidateQueryService, Candidate } from './candidate-query.service';
import { DispatchScorer } from './dispatch.scorer';
import { OfferLockService } from './offer-lock.service';
import { RiderPresenceService } from '../riders/rider-presence.service';
import { DispatchEmitter } from './events/dispatch-emitter.service';
import { DispatchRepository } from './dispatch.repository';
import { RedisService } from '../../common/redis/redis.service';
import { randomUUID } from 'crypto';

export type DispatchRound = 1 | 2 | 3 | 4 | 5;

export interface BroadcastResult {
  deliveryId: string;
  round: DispatchRound;
  offeredTo: string[];
  offerIds: Record<string, string>;
  expiresAt: Date;
}

const ROUND_CONFIG: Record<
  DispatchRound,
  { candidatesPerRound: number; ttlSeconds: number }
> = {
  1: { candidatesPerRound: 3, ttlSeconds: 45 },
  2: { candidatesPerRound: 5, ttlSeconds: 45 },
  3: { candidatesPerRound: 8, ttlSeconds: 60 },
  4: { candidatesPerRound: 12, ttlSeconds: 60 },
  5: { candidatesPerRound: 0, ttlSeconds: 0 }, // manual ops
};

@Injectable()
export class DispatchEngine {
  private readonly logger = new Logger(DispatchEngine.name);

  constructor(
    private readonly redis: RedisService,
    private readonly candidates: CandidateQueryService,
    private readonly scorer: DispatchScorer,
    private readonly offerLock: OfferLockService,
    private readonly presence: RiderPresenceService,
    private readonly emitter: DispatchEmitter,
    private readonly repo: DispatchRepository,
  ) {}

  /**
   * Entry point: begin dispatching a delivery.
   * Called when vendor marks ready-for-pickup OR order auto-reaches PREPARING.
   */
  async beginDispatch(deliveryId: string): Promise<BroadcastResult | null> {
    const delivery = await this.repo.getDeliveryForDispatch(deliveryId);
    if (!delivery) throw new Error(`Delivery ${deliveryId} not found`);

    if (delivery.status !== DeliveryStatus.LOOKING_FOR_RIDER) {
      this.logger.debug(
        `Delivery ${deliveryId} is in ${delivery.status}, skipping begin`,
      );
      return null;
    }

    const roundKey = `dispatch:${deliveryId}:round`;
    const currentRoundStr = await this.redis.getClient().get(roundKey);
    if (currentRoundStr) {
      this.logger.debug(
        `Delivery ${deliveryId} already dispatching round ${currentRoundStr}`,
      );
      return null;
    }

    return this.broadcastRound(deliveryId, 1, []);
  }

  /**
   * Broadcast a single round to a set of candidates.
   */
  async broadcastRound(
    deliveryId: string,
    round: DispatchRound,
    excludeRiderIds: string[],
  ): Promise<BroadcastResult | null> {
    const delivery = await this.repo.getDeliveryForDispatch(deliveryId);
    if (!delivery || delivery.status !== DeliveryStatus.LOOKING_FOR_RIDER) {
      return null;
    }

    if (round === 5) {
      this.logger.error(`Dispatch exhausted all 4 automated rounds for Delivery ${deliveryId}`);
      await this.emitter.emitDispatchFailed(deliveryId);
      return null;
    }

    const config = ROUND_CONFIG[round];

    // 1. Query eligible candidates
    const rawCandidates = await this.candidates.findCandidates({
      deliveryId,
      cluster: delivery.cluster,
      lat: delivery.pickupLat,
      lng: delivery.pickupLng,
      round,
      excludeRiderIds,
      limit: config.candidatesPerRound,
    });

    if (rawCandidates.length === 0) {
      this.logger.warn(
        `No candidates for delivery ${deliveryId} in round ${round}. Escalating immediately.`,
      );
      return this.broadcastRound(deliveryId, ((round + 1) as DispatchRound), excludeRiderIds);
    }

    // 2. Score candidates
    const scoredCandidates = await this.scorer.scoreCandidates(
      rawCandidates,
      {
        deliveryId,
        pickupLat: delivery.pickupLat,
        pickupLng: delivery.pickupLng,
        dropoffLat: delivery.dropoffLat,
        dropoffLng: delivery.dropoffLng,
      },
    );

    const selectedCandidates = scoredCandidates.slice(
      0,
      config.candidatesPerRound,
    );

    const now = Date.now();
    const expiresAt = new Date(now + config.ttlSeconds * 1000);
    const offeredTo: string[] = [];
    const offerIds: Record<string, string> = {};

    // 3. Atomically claim each candidate in Redis
    for (const c of selectedCandidates) {
      const offerId = `off_${randomUUID()}`;
      const claimed = await this.presence.tryClaimForOffer(
        c.riderId,
        offerId,
        config.ttlSeconds,
      );

      if (!claimed) {
        continue; // Rider got claimed by another offer concurrently
      }

      await this.offerLock.initializeOffer(offerId, c.riderId, config.ttlSeconds);

      // Record in DB
      await this.repo.recordOfferAttempt({
        deliveryId,
        riderId: c.riderId,
        offerRound: round,
        distanceMeters: c.distanceMeters,
      });

      offeredTo.push(c.riderId);
      offerIds[c.riderId] = offerId;

      // Emit event
      await this.emitter.emitOfferCreated({
        deliveryId,
        orderNumber: delivery.orderNumber,
        riderId: c.riderId,
        offerId,
        round,
        pickupAddress: delivery.pickupAddress,
        dropoffAddress: delivery.dropoffAddress,
        distanceMeters: c.distanceMeters,
        expiresAt,
      });
    }

    if (offeredTo.length === 0) {
      // All selected candidates were claimed concurrently
      return this.broadcastRound(
        deliveryId,
        ((round + 1) as DispatchRound),
        [...excludeRiderIds, ...selectedCandidates.map((c) => c.riderId)],
      );
    }

    // Set active round in Redis with TTL
    const client = this.redis.getClient();
    await client.set(
      `dispatch:${deliveryId}:round`,
      round.toString(),
      'EX',
      config.ttlSeconds + 5,
    );

    // Schedule automatic timeout in memory
    setTimeout(async () => {
      await this.handleTimeout(deliveryId, round, offeredTo);
    }, config.ttlSeconds * 1000);

    return {
      deliveryId,
      round,
      offeredTo,
      offerIds,
      expiresAt,
    };
  }

  /**
   * Handle offer timeout when no rider in the current round accepted.
   */
  async handleTimeout(
    deliveryId: string,
    round: DispatchRound,
    candidatesOffered: string[],
  ): Promise<void> {
    const delivery = await this.repo.getDeliveryForDispatch(deliveryId);
    if (!delivery || delivery.status !== DeliveryStatus.LOOKING_FOR_RIDER) {
      return; // Already accepted or cancelled
    }

    this.logger.log(`Dispatch round ${round} timed out for delivery ${deliveryId}`);

    // Clean up unclaimed riders
    for (const riderId of candidatesOffered) {
      const activeOfferId = await this.presence.getActiveOfferId(riderId);
      if (activeOfferId) {
        await this.presence.releaseOffer(riderId, activeOfferId);
        await this.repo.markOfferResponse(
          deliveryId,
          riderId,
          DispatchResponse.TIMED_OUT,
        );
      }
    }

    // Escalate to next round
    const nextRound = ((round + 1) as DispatchRound);
    await this.emitter.emitDispatchEscalated(deliveryId, nextRound);
    await this.broadcastRound(deliveryId, nextRound, candidatesOffered);
  }
}
