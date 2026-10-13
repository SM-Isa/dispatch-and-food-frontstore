// src/modules/auth/services/device.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';

export type DeviceTrustLevel = 'NEW' | 'TRUSTED' | 'SUSPICIOUS';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Called on successful login. Binds a device to the user, or updates
   * lastSeenAt if it's already known.
   */
  async bindDevice(input: {
    userId: string;
    deviceId: string;
    deviceName?: string;
    platform?: string;
    appVersion?: string;
    pushToken?: string;
  }): Promise<{ trustLevel: DeviceTrustLevel; isNew: boolean }> {
    const existing = await this.prisma.deviceBinding.findUnique({
      where: { userId_deviceId: { userId: input.userId, deviceId: input.deviceId } },
    });

    if (!existing) {
      const created = await this.prisma.deviceBinding.create({
        data: {
          userId: input.userId,
          deviceId: input.deviceId,
          deviceName: input.deviceName || null,
          platform: input.platform || null,
          appVersion: input.appVersion || null,
          pushToken: input.pushToken || null,
          trustLevel: 'NEW',
        },
      });

      this.logger.log(
        `New device bound: user=${input.userId} device=${input.deviceId} platform=${input.platform}`,
      );

      return { trustLevel: 'NEW', isNew: true };
    }

    if (existing.revokedAt) {
      throw new Error('DEVICE_REVOKED');
    }

    await this.prisma.deviceBinding.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: new Date(),
        appVersion: input.appVersion ?? existing.appVersion,
        pushToken: input.pushToken ?? existing.pushToken,
      },
    });

    return {
      trustLevel: existing.trustLevel as DeviceTrustLevel,
      isNew: false,
    };
  }

  /**
   * Promote a device to TRUSTED after 24h of clean activity
   */
  async promoteIfEligible(userId: string, deviceId: string): Promise<void> {
    const device = await this.prisma.deviceBinding.findUnique({
      where: { userId_deviceId: { userId, deviceId } },
    });
    if (!device || device.trustLevel !== 'NEW') return;

    const hoursSinceFirstSeen =
      (Date.now() - device.firstSeenAt.getTime()) / (3600 * 1000);
    if (hoursSinceFirstSeen >= 24) {
      await this.prisma.deviceBinding.update({
        where: { id: device.id },
        data: { trustLevel: 'TRUSTED' },
      });
      this.logger.log(`Device promoted to TRUSTED: user=${userId} device=${deviceId}`);
    }
  }

  async listUserDevices(userId: string) {
    return this.prisma.deviceBinding.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastSeenAt: 'desc' },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        platform: true,
        appVersion: true,
        trustLevel: true,
        firstSeenAt: true,
        lastSeenAt: true,
      },
    });
  }

  async revokeDevice(userId: string, deviceId: string): Promise<void> {
    await this.prisma.deviceBinding.update({
      where: { userId_deviceId: { userId, deviceId } },
      data: { revokedAt: new Date() },
    });
  }
}
