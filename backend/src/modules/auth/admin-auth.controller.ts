// src/modules/auth/admin-auth.controller.ts
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Ip,
  Post,
  UnauthorizedException,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { OtpService } from './services/otp.service';
import { TokenService, AccessTokenClaims } from './services/token.service';
import { TotpService } from './services/totp.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AdminAuditService } from '../admin/admin-audit.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  AdminRequestOtpDto,
  AdminVerifyLoginDto,
  AdminMfaEnrollDto,
  AdminMfaConfirmDto,
} from './dto/admin-login.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly totp: TotpService,
    private readonly audit: AdminAuditService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Admin login step 1: request OTP.
   */
  @Public()
  @Post('login/request-otp')
  @HttpCode(200)
  async requestOtp(@Body() dto: AdminRequestOtpDto, @Ip() ip: string) {
    const result = await this.otp.requestOtp({
      phoneNumber: dto.phoneNumber,
      purpose: 'LOGIN',
      ipAddress: ip,
    });
    return { data: result };
  }

  /**
   * Admin login step 2: verify OTP + TOTP.
   * Two factors required. Same request.
   */
  @Public()
  @Post('login/verify')
  @HttpCode(200)
  async verifyLogin(
    @Body() dto: AdminVerifyLoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const { userId, phoneNumber } = await this.otp.verifyOtp({
      otpId: dto.otpId,
      code: dto.otpCode,
      deviceId: dto.deviceId,
      ipAddress: ip,
      userAgent,
    });

    const user = await this.getUser(userId);
    if (user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
      await this.audit.log({
        userId,
        action: 'ADMIN_LOGIN_ROLE_DENIED',
        ipAddress: ip,
        userAgent,
      });
      throw new UnauthorizedException('NOT_AUTHORIZED');
    }

    const totpValid = await this.totp.verify(userId, dto.totpCode);
    if (!totpValid) {
      await this.audit.log({
        userId,
        action: 'ADMIN_LOGIN_TOTP_FAILED',
        ipAddress: ip,
        userAgent,
      });
      throw new UnauthorizedException('INVALID_TOTP');
    }

    const tokens = await this.tokens.issueTokens({
      userId,
      role: user.role,
      deviceId: dto.deviceId,
      ipAddress: ip,
      userAgent,
    });

    await this.audit.log({
      userId,
      action: 'ADMIN_LOGIN_SUCCESS',
      ipAddress: ip,
      userAgent,
    });

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
        },
      },
    };
  }

  /**
   * First-time MFA setup: generate secret + QR code.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('mfa/enroll')
  @HttpCode(200)
  async enrollMfa(
    @CurrentUser() user: AccessTokenClaims,
    @Body() dto: AdminMfaEnrollDto,
  ) {
    return {
      data: await this.totp.beginEnrollment(user.sub, dto.email),
    };
  }

  /**
   * Confirm MFA enrollment with the first TOTP code.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('mfa/confirm')
  @HttpCode(200)
  async confirmMfa(
    @CurrentUser() user: AccessTokenClaims,
    @Body() dto: AdminMfaConfirmDto,
  ) {
    await this.totp.confirmEnrollment(user.sub, dto.code);
    return { data: { success: true } };
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
