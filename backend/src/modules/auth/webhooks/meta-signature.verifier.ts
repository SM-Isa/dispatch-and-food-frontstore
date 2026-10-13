// src/modules/auth/webhooks/meta-signature.verifier.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class MetaSignatureVerifier {
  constructor(private readonly config: ConfigService) {}

  /**
   * Meta (WhatsApp Cloud API) signs with HMAC-SHA256.
   * Header: X-Hub-Signature-256 = "sha256=<hex>"
   */
  verify(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

    const provided = signatureHeader.slice('sha256='.length);
    const secret = this.config.get<string>('WHATSAPP_APP_SECRET', 'test_whatsapp_secret');
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

    if (expected.length !== provided.length) return false;
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
  }
}
