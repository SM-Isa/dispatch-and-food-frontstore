// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService, AccessTokenClaims } from '../services/token.service';
import { SessionService } from '../services/session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_PUBLIC_KEY') || config.get<string>('JWT_ACCESS_SECRET', 'dev_jwt_secret_key_12345'),
    });
  }

  async validate(claims: AccessTokenClaims): Promise<AccessTokenClaims> {
    // Signature + expiry checked by passport-jwt.
    // Check session liveness (immediate DB/Redis revocation verification)
    if (claims.session_id) {
      const live = await this.sessions.isLive(claims.session_id);
      if (!live) {
        throw new UnauthorizedException('SESSION_REVOKED');
      }
    }
    return claims;
  }
}
