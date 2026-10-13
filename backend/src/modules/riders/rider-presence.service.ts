import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

/**
 * RiderPresenceService owns the "who is online and where" question.
 * Redis is the source of truth for online presence (fast, geo queries).
 * Postgres is a fallback snapshot refreshed every heartbeat.
 */
@Injectable()
export class RiderPresenceService {
  private readonly logger = new Logger(RiderPresenceService.name);

  private static readonly GEO_KEY = 'riders:online';
  private static readonly HEARTBEAT_TTL_SECONDS = 90;
  private static readonly ACTIVE_OFFER_KEY = (riderId: string) =>
    `rider:${riderId}:active_offer`;
  private static readonly HEARTBEAT_KEY = (riderId: string) =>
    `rider:${riderId}:heartbeat`;
  private static readonly BUSY_KEY = (riderId: string) => `rider:${riderId}:busy`;

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Called by POST /riders/heartbeat every 20-30s.
   * Best-effort: if Redis is down, we still update Postgres.
   */
  async recordHeartbeat(input: {
    riderId: string;
    lat: number;
    lng: number;
    cluster?: string;
  }): Promise<void> {
    const client = this.redis.getClient();

    try {
      const pipeline = client.pipeline();
      pipeline.geoadd(
        RiderPresenceService.GEO_KEY,
        input.lng,
        input.lat,
        input.riderId,
      );
      pipeline.set(
        RiderPresenceService.HEARTBEAT_KEY(input.riderId),
        Date.now().toString(),
        'EX',
        RiderPresenceService.HEARTBEAT_TTL_SECONDS,
      );
      await pipeline.exec();
    } catch (err) {
      this.logger.warn(`Redis heartbeat failed for ${input.riderId}: ${(err as Error).message}`);
    }

    // Postgres fallback
    await this.prisma.rider.update({
      where: { id: input.riderId },
      data: {
        lastHeartbeatAt: new Date(),
        ...(input.cluster ? { currentCluster: input.cluster } : {}),
      },
    });
  }

  async setOnline(riderId: string, lat: number, lng: number): Promise<void> {
    const client = this.redis.getClient();
    await client
      .multi()
      .geoadd(RiderPresenceService.GEO_KEY, lng, lat, riderId)
      .set(
        RiderPresenceService.HEARTBEAT_KEY(riderId),
        Date.now().toString(),
        'EX',
        RiderPresenceService.HEARTBEAT_TTL_SECONDS,
      )
      .exec();

    await this.prisma.rider.update({
      where: { id: riderId },
      data: { isOnline: true },
    });
  }

  async setOffline(riderId: string): Promise<void> {
    const client = this.redis.getClient();
    await client
      .multi()
      .zrem(RiderPresenceService.GEO_KEY, riderId)
      .del(
        RiderPresenceService.HEARTBEAT_KEY(riderId),
        RiderPresenceService.ACTIVE_OFFER_KEY(riderId),
      )
      .exec();

    await this.prisma.rider.update({
      where: { id: riderId },
      data: { isOnline: false },
    });
  }

  async findRidersWithinRadius(
    lat: number,
    lng: number,
    radiusMeters: number,
    limit: number,
  ): Promise<Array<{ riderId: string; distanceMeters: number }>> {
    const client = this.redis.getClient();

    let result: Array<[string, string]> = [];
    try {
      result = (await (client as any).georadius(
        RiderPresenceService.GEO_KEY,
        lng,
        lat,
        radiusMeters,
        'm',
        'WITHDIST',
        'ASC',
        'COUNT',
        limit * 3,
      )) as Array<[string, string]>;
    } catch (err) {
      this.logger.warn(`Redis georadius error: ${(err as Error).message}`);
      return [];
    }

    const filtered: Array<{ riderId: string; distanceMeters: number }> = [];
    for (const [riderId, distStr] of result) {
      const [hasOffer, isBusy] = await Promise.all([
        client.exists(RiderPresenceService.ACTIVE_OFFER_KEY(riderId)),
        client.exists(RiderPresenceService.BUSY_KEY(riderId)),
      ]);
      if (hasOffer === 0 && isBusy === 0) {
        filtered.push({
          riderId,
          distanceMeters: parseFloat(distStr),
        });
        if (filtered.length >= limit) break;
      }
    }

    return filtered;
  }

  async tryClaimForOffer(
    riderId: string,
    offerId: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const client = this.redis.getClient();
    const result = await client.set(
      RiderPresenceService.ACTIVE_OFFER_KEY(riderId),
      offerId,
      'EX',
      ttlSeconds,
      'NX',
    );
    return result === 'OK';
  }

  async releaseOffer(riderId: string, offerId: string): Promise<void> {
    const client = this.redis.getClient();
    const current = await client.get(RiderPresenceService.ACTIVE_OFFER_KEY(riderId));
    if (current === offerId) {
      await client.del(RiderPresenceService.ACTIVE_OFFER_KEY(riderId));
    }
  }

  async markBusy(
    riderId: string,
    deliveryId: string,
    ttlSeconds = 3600,
  ): Promise<void> {
    const client = this.redis.getClient();
    await client.set(
      RiderPresenceService.BUSY_KEY(riderId),
      deliveryId,
      'EX',
      ttlSeconds,
    );
  }

  async markFree(riderId: string): Promise<void> {
    const client = this.redis.getClient();
    await client.del(RiderPresenceService.BUSY_KEY(riderId));
  }

  async getActiveOfferId(riderId: string): Promise<string | null> {
    const client = this.redis.getClient();
    return client.get(RiderPresenceService.ACTIVE_OFFER_KEY(riderId));
  }

  async isOnline(riderId: string): Promise<boolean> {
    const client = this.redis.getClient();
    const exists = await client.exists(
      RiderPresenceService.HEARTBEAT_KEY(riderId),
    );
    return exists === 1;
  }
}
