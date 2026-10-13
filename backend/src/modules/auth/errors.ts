// src/modules/auth/errors.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class OtpInvalidError extends HttpException {
  constructor() {
    super('OTP_INVALID', HttpStatus.UNAUTHORIZED);
  }
}

export class OtpExpiredError extends HttpException {
  constructor() {
    super('OTP_EXPIRED', HttpStatus.UNAUTHORIZED);
  }
}

export class OtpConsumedError extends HttpException {
  constructor() {
    super('OTP_CONSUMED', HttpStatus.UNAUTHORIZED);
  }
}

export class OtpRateLimitExceededError extends HttpException {
  constructor() {
    super('OTP_RATE_LIMIT_EXCEEDED', HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class SessionNotFoundError extends HttpException {
  constructor() {
    super('SESSION_NOT_FOUND', HttpStatus.UNAUTHORIZED);
  }
}

export class SessionRevokedError extends HttpException {
  constructor(reason: string) {
    super(`SESSION_REVOKED:${reason}`, HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidSignatureError extends HttpException {
  constructor(provider: string) {
    super(`INVALID_SIGNATURE:${provider}`, HttpStatus.UNAUTHORIZED);
  }
}
