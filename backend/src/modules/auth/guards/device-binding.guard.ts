// src/modules/auth/guards/device-binding.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DeviceService } from '../services/device.service';
import { REQUIRE_TRUSTED_DEVICE_KEY } from '../decorators/trusted-device.decorator';

/**
 * Applied to sensitive endpoints (payout approval, refund approval).
 * Requires the requesting device to be TRUSTED.
 */
@Injectable()
export class DeviceBindingGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly devices: DeviceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_TRUSTED_DEVICE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('NOT_AUTHENTICATED');

    const devices = await this.devices.listUserDevices(user.sub);
    const current = devices.find((d) => d.deviceId === user.device_id);

    if (!current || current.trustLevel !== 'TRUSTED') {
      throw new ForbiddenException('DEVICE_NOT_TRUSTED');
    }
    return true;
  }
}
