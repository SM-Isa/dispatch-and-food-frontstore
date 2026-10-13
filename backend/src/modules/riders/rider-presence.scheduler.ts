import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class RiderPresenceScheduler {
  private readonly logger = new Logger(RiderPresenceScheduler.name);

  constructor(private readonly redis: RedisService) {}

  @Cron('*/60 * * * * *')
  async sweepStaleRiders(): Promise<void> {
    const client = this.redis.getClient();
    try {
      const all = (await client.zrange('riders:online', 0, -1)) as string[];
      if (all.length === 0) return;

      const keys = all.map((id) => `rider:${id}:heartbeat`);
      const heartbeats = await client.mget(...keys);

      const stale: string[] = [];
      for (let i = 0; i < all.length; i++) {
        if (!heartbeats[i]) stale.push(all[i]);
      }

      if (stale.length > 0) {
        this.logger.log(`Removing ${stale.length} stale riders from geo set`);
        await client.zrem('riders:online', ...stale);
      }
    } catch (err) {
      this.logger.warn(`Stale rider sweeper error: ${(err as Error).message}`);
    }
  }
}
