// src/modules/auth/services/session.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';

/**
 * Hot-path session validity check via Redis. Falls back to DB.
 *
 * Why both:
 *   - Redis: sub-millisecond check on every authenticated request.
 *   - DB: durable source of truth; survives Redis restart.
 *
 * On revocation, we write to both. Redis TTL matches access token TTL (15 min).
 */
@Injectable()
export class SessionService {
  private static readonly CACHE_TTL_SECONDS = 15 * 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private key(sessionId: string): string {
    return `session:${sessionId}:live`;
  }

  async markLive(sessionId: string): Promise<void> {
    try {
      const client = this.redis.client();
      if (client) {
        await client.set(
          this.key(sessionId),
          '1',
          'EX',
          SessionService.CACHE_TTL_SECONDS,
        );
      }
    } catch {
      // Redis best-effort
    }
  }

  async markRevoked(sessionId: string): Promise<void> {
    try {
      const client = this.redis.client();
      if (client) {
        await client.del(this.key(sessionId));
      }
    } catch {
      // Redis best-effort
    }
  }

  async isLive(sessionId: string): Promise<boolean> {
    try {
      const client = this.redis.client();
      if (client) {
        const cached = await client.exists(this.key(sessionId));
        if (cached === 1) return true;
      }
    } catch {
      // Fallback directly to DB
    }

    // Fall back to DB
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { revokedAt: true, expiresAt: true },
    });
    if (!session) return false;
    if (session.revokedAt) return false;
    if (session.expiresAt < new Date()) return false;

    // Refresh cache
    await this.markLive(sessionId);
    return true;
  }
}
