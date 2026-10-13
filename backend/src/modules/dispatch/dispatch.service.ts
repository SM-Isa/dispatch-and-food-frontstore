import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { RedisService } from '../../common/redis/redis.service';
import { RiderOfferResponseDto } from './dto/dispatch.dto';
import { DispatchResponse, DeliveryStatus, OrderStatus } from '@dispatch/shared';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Find candidate riders and broadcast / offer delivery to the nearest eligible rider
   */
  async matchAndDispatch(deliveryId: string) {
    const delivery = await this.db.queryOne(
      `SELECT d.*, 
              ST_X(d.pickup_location::geometry) as pickup_lng,
              ST_Y(d.pickup_location::geometry) as pickup_lat,
              o.order_number
       FROM deliveries d
       JOIN orders o ON o.id = d.order_id
       WHERE d.id = $1 AND d.status = 'LOOKING_FOR_RIDER'`,
      [deliveryId],
    );

    if (!delivery) {
      throw new NotFoundException(`Delivery '${deliveryId}' not found or already assigned`);
    }

    // 1. Fetch riders who already rejected this delivery (fairness guarantee)
    const previousAttempts = await this.db.queryMany(
      `SELECT rider_id, response, offer_round FROM rider_dispatch_attempts WHERE delivery_id = $1`,
      [deliveryId],
    );

    const rejectedRiderIds = new Set(
      previousAttempts
        .filter((a) => a.response === DispatchResponse.REJECTED)
        .map((a) => a.rider_id),
    );

    const currentOfferRound = previousAttempts.length > 0
      ? Math.max(...previousAttempts.map((a) => a.offer_round)) + 1
      : 1;

    // 2. Query candidates from Redis Geospatial (primary)
    let candidateRiderIds: Array<{ riderId: string; distanceMeters: number }> = [];

    const redisRiders = await this.redis.findNearbyRiders(
      delivery.pickup_lng,
      delivery.pickup_lat,
      8, // 8 km radius
    );

    if (redisRiders.length > 0) {
      // Validate that candidates in Redis are approved and online in DB
      const placeholders = redisRiders.map((_, i) => `$${i + 1}`).join(',');
      const dbVerifiedRiders = await this.db.queryMany(
        `SELECT id FROM riders 
         WHERE id IN (${placeholders}) 
           AND is_online = true 
           AND is_approved = true 
           AND deleted_at IS NULL`,
        redisRiders.map((r) => r.riderId),
      );
      const verifiedSet = new Set(dbVerifiedRiders.map((r) => r.id));

      candidateRiderIds = redisRiders
        .filter((r) => verifiedSet.has(r.riderId) && !rejectedRiderIds.has(r.riderId))
        .map((r) => ({ riderId: r.riderId, distanceMeters: Math.round(r.distanceKm * 1000) }));
    }

    // 3. Fallback to PostgreSQL PostGIS if Redis is cold or empty
    if (candidateRiderIds.length === 0) {
      const fallbackRiders = await this.db.queryMany(
        `SELECT r.id as rider_id,
                ST_Distance(r.last_location, $1) as distance_meters
         FROM riders r
         WHERE r.is_online = true
           AND r.is_approved = true
           AND r.deleted_at IS NULL
           AND r.last_location IS NOT NULL
           AND ST_DWithin(r.last_location, $1, 10000)
         ORDER BY distance_meters ASC
         LIMIT 10`,
        [delivery.pickup_location],
      );

      candidateRiderIds = fallbackRiders
        .filter((r) => !rejectedRiderIds.has(r.rider_id))
        .map((r) => ({ riderId: r.rider_id, distanceMeters: Math.round(parseFloat(r.distance_meters)) }));
    }

    if (candidateRiderIds.length === 0) {
      this.logger.warn(`No eligible riders found for delivery ${deliveryId} in round ${currentOfferRound}`);
      return {
        dispatched: false,
        message: 'No eligible riders currently in cluster range. Re-trying shortly.',
        offerRound: currentOfferRound,
      };
    }

    // Pick nearest eligible candidate
    const targetCandidate = candidateRiderIds[0];

    // 4. Record dispatch attempt in rider_dispatch_attempts table
    await this.db.query(
      `INSERT INTO rider_dispatch_attempts (
        delivery_id, rider_id, response, distance_meters, offer_round
      )
      VALUES ($1, $2, 'OFFERED', $3, $4)
      ON CONFLICT (delivery_id, rider_id, offer_round) 
      DO UPDATE SET offered_at = now(), response = 'OFFERED'`,
      [deliveryId, targetCandidate.riderId, targetCandidate.distanceMeters, currentOfferRound],
    );

    // Update delivery offered timestamp
    await this.db.query(
      `UPDATE deliveries SET offered_at = now() WHERE id = $1`,
      [deliveryId],
    );

    // Fan-out push notification / websocket message to the selected rider
    await this.db.query(
      `INSERT INTO notifications_outbox (channel, recipient, template, payload)
       VALUES (
         'PUSH',
         (SELECT u.phone_number FROM riders r JOIN users u ON u.id = r.user_id WHERE r.id = $1),
         'RIDER_DISPATCH_OFFER',
         $2
       )`,
      [
        targetCandidate.riderId,
        JSON.stringify({
          deliveryId,
          orderNumber: delivery.order_number,
          pickupAddress: delivery.pickup_address,
          dropoffAddress: delivery.dropoff_address,
          distanceMeters: targetCandidate.distanceMeters,
          offerRound: currentOfferRound,
        }),
      ],
    );

    return {
      dispatched: true,
      offeredToRiderId: targetCandidate.riderId,
      distanceMeters: targetCandidate.distanceMeters,
      offerRound: currentOfferRound,
    };
  }

  /**
   * Process rider response to a dispatch offer
   */
  async respondToOffer(riderUserId: string, dto: RiderOfferResponseDto) {
    const rider = await this.db.queryOne(
      `SELECT id FROM riders WHERE user_id = $1`,
      [riderUserId],
    );
    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    return this.db.transaction(async (client) => {
      const attemptRes = await client.query(
        `SELECT * FROM rider_dispatch_attempts 
         WHERE delivery_id = $1 AND rider_id = $2 
         ORDER BY offer_round DESC LIMIT 1`,
        [dto.deliveryId, rider.id],
      );
      const attempt = attemptRes.rows[0];
      if (!attempt) {
        throw new NotFoundException('No active dispatch offer found for this delivery');
      }

      if (attempt.response !== DispatchResponse.OFFERED) {
        throw new BadRequestException(`Offer was already responded to (${attempt.response})`);
      }

      // Update dispatch attempt record
      await client.query(
        `UPDATE rider_dispatch_attempts
         SET response = $1, responded_at = now()
         WHERE id = $2`,
        [dto.response, attempt.id],
      );

      if (dto.response === DispatchResponse.ACCEPTED) {
        // Assign rider to delivery
        const deliveryRes = await client.query(
          `UPDATE deliveries
           SET rider_id = $1,
               status = 'ACCEPTED',
               accepted_at = now(),
               updated_at = now()
           WHERE id = $2 AND rider_id IS NULL
           RETURNING *`,
          [rider.id, dto.deliveryId],
        );
        const delivery = deliveryRes.rows[0];

        if (!delivery) {
          throw new BadRequestException('Delivery was already claimed by another rider');
        }

        // Update OMS order status
        await client.query(
          `UPDATE orders SET status = 'RIDER_ASSIGNED', updated_at = now() WHERE id = $1`,
          [delivery.order_id],
        );

        // Record in order_status_history
        await client.query(
          `INSERT INTO order_status_history (order_id, from_status, to_status, actor_id, note)
           VALUES ($1, 'AWAITING_RIDER', 'RIDER_ASSIGNED', $2, 'Rider accepted dispatch offer')`,
          [delivery.order_id, riderUserId],
        );

        return {
          success: true,
          status: 'ACCEPTED',
          deliveryId: delivery.id,
          orderId: delivery.order_id,
        };
      } else {
        // If rejected or timed out, trigger dispatch retry for next candidate
        this.logger.log(`Rider ${rider.id} rejected or timed out delivery ${dto.deliveryId}. Escalating.`);
        return {
          success: true,
          status: dto.response,
          message: 'Offer marked. Re-evaluating next candidate.',
        };
      }
    });
  }

  /**
   * Get active incoming offers for a rider
   */
  async getActiveOffersForRider(riderUserId: string) {
    const rider = await this.db.queryOne(
      `SELECT id FROM riders WHERE user_id = $1`,
      [riderUserId],
    );
    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    return this.db.queryMany(
      `SELECT rda.id as attempt_id, rda.offered_at, rda.distance_meters, rda.offer_round,
              d.id as delivery_id, d.pickup_address, d.dropoff_address,
              o.order_number, o.subtotal, o.delivery_fee
       FROM rider_dispatch_attempts rda
       JOIN deliveries d ON d.id = rda.delivery_id
       JOIN orders o ON o.id = d.order_id
       WHERE rda.rider_id = $1
         AND rda.response = 'OFFERED'
         AND d.rider_id IS NULL
         AND d.status = 'LOOKING_FOR_RIDER'
         AND rda.offered_at > now() - INTERVAL '60 seconds'
       ORDER BY rda.offered_at DESC`,
      [rider.id],
    );
  }
}
