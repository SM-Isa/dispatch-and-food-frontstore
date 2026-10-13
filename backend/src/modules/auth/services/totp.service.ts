// src/modules/auth/services/totp.service.ts
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AUTH_CONSTANTS } from '../constants';

@Injectable()
export class TotpService {
  private readonly logger = new Logger(TotpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    authenticator.options = {
      window: AUTH_CONSTANTS.ADMIN_TOTP_WINDOW,
      step: 30,
    };
  }

  /**
   * Step 1: generate a TOTP secret for the admin user. Returns QR code.
   */
  async beginEnrollment(userId: string, email: string): Promise<{
    secret: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
  }> {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(email, AUTH_CONSTANTS.ADMIN_TOTP_ISSUER, secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

    // Generate 10 backup codes
    const backupCodesPlain = Array.from({ length: 10 }, () =>
      randomBytes(5).toString('hex').toUpperCase().match(/.{5}/g)!.join('-'),
    );

    // Hash backup codes before storing
    const backupCodesHashed = await Promise.all(
      backupCodesPlain.map((c) => this.hashBackupCode(c)),
    );

    // Encrypt the secret at rest with AES-256-GCM
    const secretEncrypted = this.encryptSecret(secret);

    await this.prisma.adminTotp.upsert({
      where: { userId },
      update: {
        secret: secretEncrypted,
        backupCodes: backupCodesHashed,
        enrolledAt: new Date(),
        isActive: false, // becomes true after first successful verify
      },
      create: {
        userId,
        secret: secretEncrypted,
        backupCodes: backupCodesHashed,
        enrolledAt: new Date(),
        isActive: false,
      },
    });

    return {
      secret,
      qrCodeDataUrl,
      backupCodes: backupCodesPlain,
    };
  }

  /**
   * Step 2: verify first TOTP code and activate MFA.
   */
  async confirmEnrollment(userId: string, code: string): Promise<void> {
    const record = await this.prisma.adminTotp.findUnique({
      where: { userId },
    });
    if (!record) throw new UnauthorizedException('TOTP_NOT_ENROLLED');

    const secret = this.decryptSecret(record.secret);
    const valid = authenticator.verify({ token: code, secret });

    if (!valid) throw new UnauthorizedException('INVALID_TOTP');

    await this.prisma.adminTotp.update({
      where: { userId },
      data: { isActive: true, lastUsedAt: new Date() },
    });

    this.logger.log(`Admin MFA enabled: userId=${userId}`);
  }

  /**
   * Verify TOTP code during admin login.
   */
  async verify(userId: string, code: string): Promise<boolean> {
    const record = await this.prisma.adminTotp.findUnique({
      where: { userId, isActive: true },
    });
    if (!record) return false;

    const secret = this.decryptSecret(record.secret);
    const valid = authenticator.verify({ token: code, secret });

    if (valid) {
      await this.prisma.adminTotp.update({
        where: { userId },
        data: { lastUsedAt: new Date() },
      });
    }

    return valid;
  }

  /**
   * Verify and burn single-use backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const record = await this.prisma.adminTotp.findUnique({
      where: { userId, isActive: true },
    });
    if (!record) return false;

    for (let i = 0; i < record.backupCodes.length; i++) {
      const matches = await this.verifyBackupCodeHash(record.backupCodes[i], code);
      if (matches) {
        const remaining = [...record.backupCodes];
        remaining.splice(i, 1);
        await this.prisma.adminTotp.update({
          where: { userId },
          data: { backupCodes: remaining },
        });
        this.logger.warn(
          `Admin backup code used: userId=${userId} remaining=${remaining.length}`,
        );
        return true;
      }
    }

    return false;
  }

  // ----------------------------------------------------------------
  // Encryption & Hashing
  // ----------------------------------------------------------------

  private async hashBackupCode(plain: string): Promise<string> {
    try {
      return await argon2.hash(plain);
    } catch {
      return bcrypt.hash(plain, 10);
    }
  }

  private async verifyBackupCodeHash(hash: string, plain: string): Promise<boolean> {
    try {
      if (hash.startsWith('$argon2')) {
        return await argon2.verify(hash, plain);
      }
      return await bcrypt.compare(plain, hash);
    } catch {
      return false;
    }
  }

  private encryptSecret(plain: string): string {
    const keyStr = this.config.get<string>('TOTP_ENCRYPTION_KEY', 'default_secret_encryption_key_32b_!');
    // 32-byte key buffer
    const key = Buffer.alloc(32);
    Buffer.from(keyStr).copy(key);

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
  }

  private decryptSecret(encrypted: string): string {
    const keyStr = this.config.get<string>('TOTP_ENCRYPTION_KEY', 'default_secret_encryption_key_32b_!');
    const key = Buffer.alloc(32);
    Buffer.from(keyStr).copy(key);

    const [ivB64, authTagB64, ciphertextB64] = encrypted.split('.');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}
