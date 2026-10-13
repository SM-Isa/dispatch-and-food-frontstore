// src/modules/auth/constants.ts

export const AUTH_CONSTANTS = {
  // OTP
  OTP_LENGTH: 6,
  OTP_TTL_SECONDS: 300, // 5 minutes
  OTP_MAX_ATTEMPTS: 5,
  OTP_RATE_LIMIT_PER_PHONE: { count: 3, windowSeconds: 900 }, // 3 / 15 min
  OTP_RATE_LIMIT_PER_IP: { count: 10, windowSeconds: 3600 }, // 10 / hr

  // Access token
  ACCESS_TOKEN_TTL_SECONDS: 900, // 15 minutes
  ACCESS_TOKEN_ALGORITHM: 'ES256' as const,
  ACCESS_TOKEN_ISSUER: 'dispatch.ng',
  ACCESS_TOKEN_AUDIENCE: 'dispatch-api',

  // Refresh token
  REFRESH_TOKEN_TTL_SECONDS: 30 * 24 * 3600, // 30 days
  REFRESH_TOKEN_BYTES: 48, // ~64 chars base64url

  // Device binding
  DEVICE_NEW_THRESHOLD_HOURS: 24, // new devices require OTP re-auth for sensitive ops

  // Admin
  ADMIN_ACCESS_TTL_SECONDS: 900, // 15 min
  ADMIN_TOTP_WINDOW: 1, // ±1 window (±30s)
  ADMIN_TOTP_ISSUER: 'Dispatch Admin',
  ADMIN_SESSION_TTL_SECONDS: 8 * 3600, // 8 hours (workday)

  // Session
  SESSION_CLEANUP_BATCH: 1000,
} as const;

export const SENSITIVE_ACTIONS = [
  'payout.approve',
  'refund.approve',
  'vendor.commission.change',
  'rider.suspend',
  'admin.create',
] as const;
