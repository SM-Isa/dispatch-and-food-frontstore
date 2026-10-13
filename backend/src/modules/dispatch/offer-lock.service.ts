import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';

/**
 * Provides atomic single-winner semantics for offers.
 *
 * Flow:
 *   1. Engine creates offer → SET offer:{id}:status = OFFERED (TTL = offer TTL)
 *   2. Rider calls /accept → offerLock.claimOffer(offerId, riderId)
 *        → If status == OFFERED, SET status = ACCEPTED_BY_{riderId} with NX
 *        → First caller wins; subsequent callers get false
 *   3. Engine/OffersService commits the DB transaction
 */
@Injectable()
export class OfferLockService {
  private readonly logger = new Logger(OfferLockService.name);

  constructor(private readonly redis: RedisService) {}

  private statusKey(offerId: string): string {
    return `offer:${offerId}:status`;
  }

  async initializeOffer(offerId: string, riderId: string, ttlSeconds: number): Promise<void> {
    const client = this.redis.getClient();
    await client.set(
      this.statusKey(offerId),
      `OFFERED:${riderId}`,
      'EX',
      ttlSeconds,
    );
  }

  async claimOffer(offerId: string, riderId: string): Promise<boolean> {
    const client = this.redis.getClient();
    const claimKey = `offer:${offerId}:claimed`;

    // SET NX with riderId value — winner is the first SET to succeed.
    const result = await client.set(
      claimKey,
      riderId,
      'EX',
      300,
      'NX',
    );

    if (result !== 'OK') {
      const winner = await client.get(claimKey);
      this.logger.debug(
        `Offer ${offerId} already claimed by ${winner}, rejected for ${riderId}`,
      );
      return false;
    }

    return true;
  }

  async getWinner(offerId: string): Promise<string | null> {
    const client = this.redis.getClient();
    return client.get(`offer:${offerId}:claimed`);
  }

  async isOfferLive(offerId: string): Promise<boolean> {
    const client = this.redis.getClient();
    const exists = await client.exists(this.statusKey(offerId));
    return exists === 1;
  }

  async cancelOffer(offerId: string): Promise<void> {
    const client = this.redis.getClient();
    await client.del(this.statusKey(offerId), `offer:${offerId}:claimed`);
  }
}
