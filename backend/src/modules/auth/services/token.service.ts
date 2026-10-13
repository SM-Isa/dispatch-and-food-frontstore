// src/modules/auth/services/token.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { AUTH_CONSTANTS } from '../constants';
import { SessionRevokedError, SessionNotFoundError } from '../errors';

export interface AccessTokenClaims {
  sub: string; // user id
  role: string;
  device_id: string;
  session_id: string;
  jti: string; // access token id (for revocation of privileged ops)
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
  sessionId: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Issue a new access + refresh token pair.
   * Refresh token is opaque (not a JWT). Stored hashed in DB.
   */
  async issueTokens(input: {
    userId: string;
    role: string;
    deviceId: string;
    ipAddress: string;
    userAgent?: string;
  }): Promise<IssuedTokens> {
    const now = new Date();
    const accessExpiresAt = new Date(now.getTime() + AUTH_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS * 1000);
    const refreshExpiresAt = new Date(now.getTime() + AUTH_CONSTANTS.REFRESH_TOKEN_TTL_SECONDS * 1000);

    // Refresh token: opaque random string. jti is its SHA-256 hash (never store plaintext).
    const refreshToken = randomBytes(AUTH_CONSTANTS.REFRESH_TOKEN_BYTES).toString('base64url');
    const refreshJti = createHash('sha256').update(refreshToken).digest('hex');

    const session = await this.prisma.session.create({
      data: {
        userId: input.userId,
        refreshJti,
        deviceId: input.deviceId,
        userAgent: input.userAgent || null,
        ipAddress: input.ipAddress || null,
        expiresAt: refreshExpiresAt,
      },
      select: { id: true },
    });

    const accessToken = await this.jwt.signAsync(
      {
        sub: input.userId,
        role: input.role,
        device_id: input.deviceId,
        session_id: session.id,
      },
      {
        expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS,
        jwtid: randomBytes(16).toString('hex'),
      },
    );

    return {
      accessToken,
      refreshToken,
      accessExpiresAt,
      refreshExpiresAt,
      sessionId: session.id,
    };
  }

  /**
   * Rotate refresh token. Old token is revoked. New session created.
   * All-or-nothing: if rotation fails, the old token remains revoked/handled.
   */
  async rotateRefreshToken(input: {
    refreshToken: string;
    deviceId: string;
    ipAddress: string;
    userAgent?: string;
  }): Promise<IssuedTokens> {
    const jti = createHash('sha256').update(input.refreshToken).digest('hex');

    const session = await this.prisma.session.findUnique({
      where: { refreshJti: jti },
      include: { user: { select: { id: true, role: true, isActive: true } } },
    });

    if (!session) throw new SessionNotFoundError();
    if (session.revokedAt) throw new SessionRevokedError(session.revokedReason ?? 'UNKNOWN');
    if (session.expiresAt < new Date()) throw new SessionRevokedError('EXPIRED');
    if (!session.user.isActive) throw new SessionRevokedError('ACCOUNT_DISABLED');

    // Device binding check: if the refresh token is used from a different device,
    // treat it as theft — revoke the session AND all user's sessions.
    if (session.deviceId !== input.deviceId) {
      this.logger.warn(
        `Refresh token used from different device. user=${session.userId} ` +
          `expected=${session.deviceId} got=${input.deviceId}`,
      );
      await this.revokeAllUserSessions(session.userId, 'DEVICE_MISMATCH');
      throw new SessionRevokedError('DEVICE_MISMATCH');
    }

    // Mark previous session revoked
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), revokedReason: 'ROTATED' },
    });

    // Issue brand-new rotated pair
    return this.issueTokens({
      userId: session.user.id,
      role: session.user.role,
      deviceId: input.deviceId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }

  /**
   * Revoke a single session (logout).
   */
  async revokeSession(sessionId: string, reason: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  /**
   * Revoke all sessions for a user ("logout everywhere").
   */
  async revokeAllUserSessions(userId: string, reason: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
    return result.count;
  }

  /**
   * Verify access token and return claims.
   */
  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    return this.jwt.verifyAsync<AccessTokenClaims>(token);
  }

  /**
   * For privileged operations, check that the session is still live.
   */
  async isSessionLive(sessionId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { revokedAt: true, expiresAt: true },
    });
    if (!session) return false;
    if (session.revokedAt) return false;
    if (session.expiresAt < new Date()) return false;
    return true;
  }

  /**
   * Cleanup expired sessions. Runs nightly.
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { lt: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
        ],
      },
    });
    return result.count;
  }
}
