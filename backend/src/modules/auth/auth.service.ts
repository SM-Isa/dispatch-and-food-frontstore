// src/modules/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { DeviceService } from './services/device.service';
import { SessionService } from './services/session.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    public readonly otpService: OtpService,
    public readonly tokenService: TokenService,
    public readonly deviceService: DeviceService,
    public readonly sessionService: SessionService,
  ) {}

  async requestOtp(dto: RequestOtpDto, ip: string = '127.0.0.1') {
    return this.otpService.requestOtp({
      phoneNumber: dto.phoneNumber,
      purpose: dto.purpose || 'LOGIN',
      ipAddress: ip,
    });
  }

  async verifyOtp(dto: VerifyOtpDto, ip: string = '127.0.0.1') {
    return this.otpService.verifyOtp({
      otpId: dto.otpId,
      code: dto.code,
      deviceId: dto.deviceId,
      ipAddress: ip,
    });
  }
}
