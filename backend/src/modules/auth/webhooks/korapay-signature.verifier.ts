// src/modules/auth/webhooks/korapay-signature.verifier.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class KorapaySignatureVerifier {
  constructor(private readonly config: ConfigService) {}

  /**
   * Korapay signs with HMAC-SHA256. Header: x-korapay-signature
   */
  verify(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) return false;

    const secret = this.config.get<string>('KORAPAY_WEBHOOK_SECRET', 'test_korapay_secret');
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

    if (expected.length !== signatureHeader.length) return false;
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signatureHeader, 'hex'));
  }
}
