// src/modules/auth/webhooks/monnify-signature.verifier.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class MonnifySignatureVerifier {
  constructor(private readonly config: ConfigService) {}

  /**
   * Monnify signs webhook body with HMAC-SHA512 using the secret key.
   * Header: monnify-signature
   */
  verify(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) return false;

    const secret = this.config.get<string>('MONNIFY_WEBHOOK_SECRET', 'test_monnify_secret');
    const expected = createHmac('sha512', secret).update(rawBody).digest('hex');

    return this.safeCompare(expected, signatureHeader);
  }

  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  }
}
