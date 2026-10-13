// src/modules/auth/auth.module.ts
import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthController } from './auth.controller';
import { AdminAuthController } from './admin-auth.controller';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { DeviceService } from './services/device.service';
import { TotpService } from './services/totp.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MonnifySignatureVerifier } from './webhooks/monnify-signature.verifier';
import { KorapaySignatureVerifier } from './webhooks/korapay-signature.verifier';
import { MetaSignatureVerifier } from './webhooks/meta-signature.verifier';
import { AdminAuditService } from '../admin/admin-audit.service';
import { AUTH_CONSTANTS } from './constants';

import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    RedisModule,
    NotificationsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET', 'dev_jwt_secret_key_12345'),
        signOptions: {
          expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS,
          issuer: AUTH_CONSTANTS.ACCESS_TOKEN_ISSUER,
          audience: AUTH_CONSTANTS.ACCESS_TOKEN_AUDIENCE,
        },
      }),
    }),
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [
    AuthService,
    OtpService,
    TokenService,
    SessionService,
    DeviceService,
    TotpService,
    JwtStrategy,
    MonnifySignatureVerifier,
    KorapaySignatureVerifier,
    MetaSignatureVerifier,
    AdminAuditService,
  ],
  exports: [
    AuthService,
    OtpService,
    TokenService,
    SessionService,
    DeviceService,
    TotpService,
    MonnifySignatureVerifier,
    KorapaySignatureVerifier,
    MetaSignatureVerifier,
    AdminAuditService,
    JwtModule,
  ],
})
export class AuthModule {}
