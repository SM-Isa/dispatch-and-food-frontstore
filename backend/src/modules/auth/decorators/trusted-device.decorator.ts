// src/modules/auth/decorators/trusted-device.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const REQUIRE_TRUSTED_DEVICE_KEY = 'requireTrustedDevice';
export const RequireTrustedDevice = () => SetMetadata(REQUIRE_TRUSTED_DEVICE_KEY, true);
