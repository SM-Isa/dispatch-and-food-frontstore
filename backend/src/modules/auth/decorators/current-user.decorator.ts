// src/modules/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenClaims } from '../services/token.service';

export const CurrentUser = createParamDecorator(
  (data: keyof AccessTokenClaims | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AccessTokenClaims;
    return data ? user?.[data] : user;
  },
);
