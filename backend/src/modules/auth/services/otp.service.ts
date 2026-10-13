// src/modules/auth/services/otp.service.ts
import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationChannel } from '@dispatch/shared';
import { AUTH_CONSTANTS } from '../constants';
import {
  OtpRateLimitExceededError,
  OtpInvalidError,
  OtpExpiredError,
  OtpConsumedError,
} from '../errors';

export interface RequestOtpInput {
  phoneNumber: string;
  purpose: 'LOGIN' | 'ORDER_CONFIRM' | 'PAYOUT' | 'SENSITIVE_ACTION';
  ipAddress: string;
  userAgent?: string;
}

export interface VerifyOtpInput {
  otpId: string;
  code: string;
  deviceId: string;
  ipAddress: string;
  userAgent?: string;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Request an OTP. Always returns 200, whether or not the phone exists.
   * This prevents account enumeration.
   *
   * Rate limits:
   *   - 3 per phone per 15 min
   *   - 10 per IP per hour
   */
  async requestOtp(input: RequestOtpInput): Promise<{ otpId: string; expiresInSeconds: number }> {
    await this.enforceRateLimits(input.phoneNumber, input.ipAddress);

    const code = this.generateCode();
    const codeHash = await this.hashCode(code);

    const expiresAt = new Date(Date.now() + AUTH_CONSTANTS.OTP_TTL_SECONDS * 1000);

    const otp = await this.prisma.otpCode.create({
      data: {
        phoneNumber: input.phoneNumber,
        codeHash,
        purpose: input.purpose,
        expiresAt,
        attempts: 0,
        maxAttempts: AUTH_CONSTANTS.OTP_MAX_ATTEMPTS,
      },
      select: { id: true },
    });

    // Enqueue SMS via transactional notifications outbox
    this.notifications
      .enqueue(
        NotificationChannel.SMS,
        input.phoneNumber,
        'OTP_VERIFICATION',
        {
          code,
          expiresMinutes: Math.floor(AUTH_CONSTANTS.OTP_TTL_SECONDS / 60),
          message: `Your Dispatch code is ${code}. Valid for 5 minutes. Never share it with anyone.`,
        },
      )
      .catch((err) => {
        this.logger.error(
          `Failed to enqueue OTP SMS to ${this.maskPhone(input.phoneNumber)}: ${err.message}`,
        );
      });

    this.logger.log(
      `OTP requested for ${this.maskPhone(input.phoneNumber)} purpose=${input.purpose} ip=${input.ipAddress}`,
    );

    return {
      otpId: otp.id,
      expiresInSeconds: AUTH_CONSTANTS.OTP_TTL_SECONDS,
    };
  }

  /**
   * Verify OTP. Returns the user (creating one if it's a first-time phone).
   */
  async verifyOtp(input: VerifyOtpInput): Promise<{
    userId: string;
    phoneNumber: string;
    isNewUser: boolean;
  }> {
    const otp = await this.prisma.otpCode.findUnique({
      where: { id: input.otpId },
    });

    if (!otp) throw new OtpInvalidError();
    if (otp.consumedAt) throw new OtpConsumedError();
    if (otp.expiresAt < new Date()) throw new OtpExpiredError();
    if (otp.attempts >= otp.maxAttempts) throw new OtpRateLimitExceededError();

    // Verify hash
    const matches = await this.verifyCode(otp.codeHash, input.code);

    if (!matches) {
      // Increment attempts atomically
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });

      // If this was the last attempt, log for fraud monitoring
      const updated = await this.prisma.otpCode.findUnique({
        where: { id: otp.id },
        select: { attempts: true, maxAttempts: true },
      });

      if (updated && updated.attempts >= updated.maxAttempts) {
        this.logger.warn(
          `OTP max attempts exceeded for ${this.maskPhone(otp.phoneNumber)} ip=${input.ipAddress}`,
        );
      }

      throw new OtpInvalidError();
    }

    // Mark consumed (single-use)
    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    // Find or create user
    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber: otp.phoneNumber },
      select: { id: true, isActive: true },
    });

    if (existing && !existing.isActive) {
      throw new UnauthorizedException('ACCOUNT_DISABLED');
    }

    if (existing) {
      return {
        userId: existing.id,
        phoneNumber: otp.phoneNumber,
        isNewUser: false,
      };
    }

    const created = await this.prisma.user.create({
      data: {
        phoneNumber: otp.phoneNumber,
        phoneVerifiedAt: new Date(),
        role: 'CUSTOMER',
        isActive: true,
      },
      select: { id: true },
    });

    this.logger.log(
      `New user created: ${this.maskPhone(otp.phoneNumber)} id=${created.id}`,
    );

    return {
      userId: created.id,
      phoneNumber: otp.phoneNumber,
      isNewUser: true,
    };
  }

  /**
   * Cleanup expired OTPs. Runs hourly.
   */
  async cleanupExpiredOtps(): Promise<number> {
    const result = await this.prisma.otpCode.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } },
          { consumedAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } },
        ],
      },
    });
    return result.count;
  }

  // ----------------------------------------------------------------
  // Private Helpers
  // ----------------------------------------------------------------

  private generateCode(): string {
    const min = 10 ** (AUTH_CONSTANTS.OTP_LENGTH - 1);
    const max = 10 ** AUTH_CONSTANTS.OTP_LENGTH;
    return String(randomInt(min, max));
  }

  private async hashCode(code: string): Promise<string> {
    try {
      return await argon2.hash(code, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });
    } catch {
      // Graceful fallback to bcrypt if argon2 native module unavailable
      return bcrypt.hash(code, 10);
    }
  }

  private async verifyCode(hash: string, plain: string): Promise<boolean> {
    try {
      if (hash.startsWith('$argon2')) {
        return await argon2.verify(hash, plain);
      }
      return await bcrypt.compare(plain, hash);
    } catch {
      return false;
    }
  }

  private async enforceRateLimits(phoneNumber: string, ipAddress: string): Promise<void> {
    try {
      const client = this.redis.client();
      if (!client) return;

      const phoneKey = `ratelimit:otp:phone:${phoneNumber}`;
      const ipKey = `ratelimit:otp:ip:${ipAddress}`;

      const phoneLimit = AUTH_CONSTANTS.OTP_RATE_LIMIT_PER_PHONE;
      const ipLimit = AUTH_CONSTANTS.OTP_RATE_LIMIT_PER_IP;

      const [phoneCount, ipCount] = await Promise.all([
        client.incr(phoneKey),
        client.incr(ipKey),
      ]);

      if (phoneCount === 1) {
        await client.expire(phoneKey, phoneLimit.windowSeconds);
      }
      if (ipCount === 1) {
        await client.expire(ipKey, ipLimit.windowSeconds);
      }

      if (phoneCount > phoneLimit.count) {
        this.logger.warn(`OTP phone rate limit exceeded: ${this.maskPhone(phoneNumber)}`);
        throw new OtpRateLimitExceededError();
      }
      if (ipCount > ipLimit.count) {
        this.logger.warn(`OTP IP rate limit exceeded: ${ipAddress}`);
        throw new OtpRateLimitExceededError();
      }
    } catch (err) {
      if (err instanceof OtpRateLimitExceededError) throw err;
      this.logger.warn(`Redis rate limit check bypassed: ${(err as Error).message}`);
    }
  }

  private maskPhone(phone: string): string {
    if (phone.length < 8) return '***';
    return `${phone.slice(0, phone.length - 7)}***${phone.slice(-4)}`;
  }
}
