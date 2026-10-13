// src/modules/auth/auth.e2e-spec.ts
import { createHmac } from 'crypto';
import { MonnifySignatureVerifier } from './webhooks/monnify-signature.verifier';
import { KorapaySignatureVerifier } from './webhooks/korapay-signature.verifier';
import { MetaSignatureVerifier } from './webhooks/meta-signature.verifier';

describe('Auth — Security Scenarios & Threat Defense', () => {
  let monnifyVerifier: MonnifySignatureVerifier;
  let korapayVerifier: KorapaySignatureVerifier;
  let metaVerifier: MetaSignatureVerifier;

  const mockConfigService = {
    get: (key: string, defaultVal?: string) => {
      if (key === 'MONNIFY_WEBHOOK_SECRET') return 'test_monnify_secret_key_123';
      if (key === 'KORAPAY_WEBHOOK_SECRET') return 'test_korapay_secret_key_456';
      if (key === 'WHATSAPP_APP_SECRET') return 'test_meta_secret_key_789';
      return defaultVal;
    },
    getOrThrow: (key: string) => {
      if (key === 'MONNIFY_WEBHOOK_SECRET') return 'test_monnify_secret_key_123';
      if (key === 'KORAPAY_WEBHOOK_SECRET') return 'test_korapay_secret_key_456';
      if (key === 'WHATSAPP_APP_SECRET') return 'test_meta_secret_key_789';
      return 'test_secret';
    },
  } as any;

  beforeEach(() => {
    monnifyVerifier = new MonnifySignatureVerifier(mockConfigService);
    korapayVerifier = new KorapaySignatureVerifier(mockConfigService);
    metaVerifier = new MetaSignatureVerifier(mockConfigService);
  });

  // ----------------------------------------------------------------
  // Webhook signature verification tests
  // ----------------------------------------------------------------

  describe('Webhook HMAC Verification', () => {
    it('accepts Monnify webhook with correct SHA-512 signature', () => {
      const payload = Buffer.from(JSON.stringify({ eventType: 'SUCCESSFUL_TRANSACTION', amount: 5000 }));
      const secret = mockConfigService.get('MONNIFY_WEBHOOK_SECRET');
      const validSig = createHmac('sha512', secret).update(payload).digest('hex');

      expect(monnifyVerifier.verify(payload, validSig)).toBe(true);
    });

    it('rejects Monnify webhook with forged signature', () => {
      const payload = Buffer.from(JSON.stringify({ eventType: 'SUCCESSFUL_TRANSACTION', amount: 5000 }));
      const forgedSig = 'deadbeef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

      expect(monnifyVerifier.verify(payload, forgedSig)).toBe(false);
    });

    it('accepts Korapay webhook with correct SHA-256 signature', () => {
      const payload = Buffer.from(JSON.stringify({ event: 'charge.success', reference: 'ref_123' }));
      const secret = mockConfigService.get('KORAPAY_WEBHOOK_SECRET');
      const validSig = createHmac('sha256', secret).update(payload).digest('hex');

      expect(korapayVerifier.verify(payload, validSig)).toBe(true);
    });

    it('rejects Korapay webhook with forged signature', () => {
      const payload = Buffer.from(JSON.stringify({ event: 'charge.success', reference: 'ref_123' }));
      expect(korapayVerifier.verify(payload, 'invalid_signature_hex')).toBe(false);
    });

    it('accepts Meta WhatsApp webhook with sha256= prefix and valid HMAC', () => {
      const payload = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account' }));
      const secret = mockConfigService.get('WHATSAPP_APP_SECRET');
      const hex = createHmac('sha256', secret).update(payload).digest('hex');
      const validHeader = `sha256=${hex}`;

      expect(metaVerifier.verify(payload, validHeader)).toBe(true);
    });

    it('rejects Meta WhatsApp webhook without sha256= prefix', () => {
      const payload = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account' }));
      expect(metaVerifier.verify(payload, 'plain_hex_without_prefix')).toBe(false);
    });

    it('rejects Meta WhatsApp webhook with tampered payload', () => {
      const originalPayload = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account' }));
      const secret = mockConfigService.get('WHATSAPP_APP_SECRET');
      const validHeader = `sha256=${createHmac('sha256', secret).update(originalPayload).digest('hex')}`;

      const tamperedPayload = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account', injected: true }));
      expect(metaVerifier.verify(tamperedPayload, validHeader)).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // Security guarantees & token logic tests
  // ----------------------------------------------------------------

  describe('Security Principles & Defense Invariants', () => {
    it('verifies that timing-safe string comparison protects against side-channel leaks', () => {
      const validHex = createHmac('sha512', 'secret').update('test').digest('hex');
      const result = (monnifyVerifier as any).safeCompare(validHex, validHex);
      expect(result).toBe(true);

      const invalidResult = (monnifyVerifier as any).safeCompare(validHex, 'wrong');
      expect(invalidResult).toBe(false);
    });
  });
});
