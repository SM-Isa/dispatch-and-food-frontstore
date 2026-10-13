import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    this.redisClient = new Redis({
      host,
      port,
      password: password || undefined,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    this.redisClient.connect().then(() => {
      this.logger.log(`Connected to Redis at ${host}:${port}`);
    }).catch((err) => {
      this.logger.warn(`Could not connect to Redis: ${err.message}. Running in fallback mode.`);
    });
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis connection closed');
    }
  }

  getClient(): Redis {
    return this.redisClient;
  }

  client(): Redis {
    return this.redisClient;
  }

  /**
   * Update real-time rider location using Redis Geospatial (GEOADD)
   */
  async updateRiderLocation(riderId: string, longitude: number, latitude: number, cluster: string = 'GLOBAL'): Promise<void> {
    try {
      const pipeline = this.redisClient.pipeline();
      // GEOADD key longitude latitude member
      pipeline.geoadd(`riders:geo:${cluster}`, longitude, latitude, riderId);
      pipeline.geoadd('riders:geo:all', longitude, latitude, riderId);
      pipeline.set(`rider:heartbeat:${riderId}`, Date.now().toString(), 'EX', 300); // 5 min TTL
      await pipeline.exec();
    } catch (err) {
      this.logger.error(`Error updating rider geospatial location: ${err.message}`);
    }
  }

  /**
   * Query riders within radius using GEORADIUS / GEOSEARCH
   */
  async findNearbyRiders(
    longitude: number,
    latitude: number,
    radiusKm: number = 5,
    cluster?: string,
  ): Promise<Array<{ riderId: string; distanceKm: number }>> {
    try {
      const key = cluster ? `riders:geo:${cluster}` : 'riders:geo:all';
      // Use GEORADIUS with coordinates
      const results = (await this.redisClient.georadius(
        key,
        longitude,
        latitude,
        radiusKm,
        'km',
        'WITHDIST',
        'ASC',
      )) as unknown as Array<[string, string]>;

      return results.map(([riderId, distanceStr]) => ({
        riderId,
        distanceKm: parseFloat(distanceStr),
      }));
    } catch (err) {
      this.logger.error(`Error querying nearby riders from Redis: ${err.message}`);
      return [];
    }
  }

  /**
   * Remove rider from real-time dispatch pool when going offline
   */
  async removeRiderFromDispatch(riderId: string, cluster: string = 'GLOBAL'): Promise<void> {
    try {
      await this.redisClient.zrem(`riders:geo:${cluster}`, riderId);
      await this.redisClient.zrem('riders:geo:all', riderId);
      await this.redisClient.del(`rider:heartbeat:${riderId}`);
    } catch (err) {
      this.logger.error(`Error removing rider from Redis: ${err.message}`);
    }
  }
}
