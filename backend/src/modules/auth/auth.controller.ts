// src/modules/auth/auth.controller.ts
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Ip,
  Post,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { OtpService } from './services/otp.service';
import { TokenService, AccessTokenClaims } from './services/token.service';
import { DeviceService } from './services/device.service';
import { SessionService } from './services/session.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshDto } from './dto/refresh.dto';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly devices: DeviceService,
    private readonly sessions: SessionService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /auth/otp/request
   * Always returns 200. Does not reveal whether phone exists (enumeration defense).
   */
  @Public()
  @Post('otp/request')
  @HttpCode(200)
  async requestOtp(
    @Body() dto: RequestOtpDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const result = await this.otp.requestOtp({
      phoneNumber: dto.phoneNumber,
      purpose: dto.purpose ?? 'LOGIN',
      ipAddress: ip,
      userAgent,
    });
    return { data: result };
  }

  /**
   * POST /auth/otp/verify
   * Returns access + refresh tokens, and binds the device.
   */
  @Public()
  @Post('otp/verify')
  @HttpCode(200)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const { userId, phoneNumber, isNewUser } = await this.otp.verifyOtp({
      otpId: dto.otpId,
      code: dto.code,
      deviceId: dto.deviceId,
      ipAddress: ip,
      userAgent,
    });

    const user = await this.getUser(userId);

    const device = await this.devices.bindDevice({
      userId,
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
      platform: dto.platform,
      appVersion: dto.appVersion,
      pushToken: dto.pushToken,
    });

    const tokens = await this.tokens.issueTokens({
      userId,
      role: user.role,
      deviceId: dto.deviceId,
      ipAddress: ip,
      userAgent,
    });

    await this.sessions.markLive(tokens.sessionId);

    return {
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: Math.floor(
          (tokens.accessExpiresAt.getTime() - Date.now()) / 1000,
        ),
        user: {
          id: user.id,
          role: user.role,
          phoneNumber,
          fullName: user.fullName,
          isNewUser,
        },
        device: {
          trustLevel: device.trustLevel,
          isNew: device.isNew,
        },
      },
    };
  }

  /**
   * POST /auth/refresh
   * Rotates refresh token. Old token is revoked.
   */
  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body() dto: RefreshDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const tokens = await this.tokens.rotateRefreshToken({
      refreshToken: dto.refreshToken,
      deviceId: dto.deviceId,
      ipAddress: ip,
      userAgent,
    });

    await this.sessions.markLive(tokens.sessionId);

    return {
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: Math.floor(
          (tokens.accessExpiresAt.getTime() - Date.now()) / 1000,
        ),
      },
    };
  }

  /**
   * POST /auth/logout
   * Revokes the current session.
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@CurrentUser() user: AccessTokenClaims) {
    if (user.session_id) {
      await this.tokens.revokeSession(user.session_id, 'USER_LOGOUT');
      await this.sessions.markRevoked(user.session_id);
    }
    return { data: { success: true } };
  }

  /**
   * POST /auth/logout-all
   * Revokes ALL sessions for the user across all devices.
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(200)
  async logoutAll(@CurrentUser() user: AccessTokenClaims) {
    const count = await this.tokens.revokeAllUserSessions(user.sub, 'USER_LOGOUT_ALL');
    return { data: { sessionsRevoked: count } };
  }

  // ----------------------------------------------------------------
  private async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, fullName: true, phoneNumber: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
