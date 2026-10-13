// src/modules/ledger/ledger.e2e-spec.ts
import { Prisma } from '@prisma/client';
import { LedgerService } from './ledger.service';
import { LedgerRepository, WalletRow } from './ledger.repository';
import {
  EmptyEntryGroupError,
  LedgerImbalanceError,
  WalletLockedError,
} from './errors';
import { AccountCode, PostEntryGroupInput } from './types';

describe('Ledger — Zero-Sum Invariant & Concurrency E2E Tests', () => {
  let ledgerService: LedgerService;
  let mockPrisma: any;
  let mockRepo: any;

  // In-memory simulation of wallet store for concurrency testing
  let inMemoryWallets: Map<string, WalletRow>;
  let inMemoryEntries: Array<any>;
  let inMemoryEntryGroups: Set<string>;
  let inMemoryIdempotencyKeys: Set<string>;

  beforeEach(() => {
    inMemoryWallets = new Map();
    inMemoryEntries = [];
    inMemoryEntryGroups = new Set();
    inMemoryIdempotencyKeys = new Set();

    // Seed test wallets
    inMemoryWallets.set('wallet_escrow', {
      id: 'wallet_escrow',
      balance: new Prisma.Decimal(100000),
      currency: 'NGN',
      ledger_type: 'CUSTOMER_ESCROW',
      is_locked: false,
    });
    inMemoryWallets.set('wallet_vendor', {
      id: 'wallet_vendor',
      balance: new Prisma.Decimal(0),
      currency: 'NGN',
      ledger_type: 'VENDOR_PAYABLE',
      is_locked: false,
    });
    inMemoryWallets.set('wallet_rider', {
      id: 'wallet_rider',
      balance: new Prisma.Decimal(0),
      currency: 'NGN',
      ledger_type: 'RIDER_PAYABLE',
      is_locked: false,
    });
    inMemoryWallets.set('wallet_platform', {
      id: 'wallet_platform',
      balance: new Prisma.Decimal(0),
      currency: 'NGN',
      ledger_type: 'PLATFORM_REVENUE',
      is_locked: false,
    });
    inMemoryWallets.set('wallet_locked', {
      id: 'wallet_locked',
      balance: new Prisma.Decimal(5000),
      currency: 'NGN',
      ledger_type: 'VENDOR_PAYABLE',
      is_locked: true,
    });

    mockRepo = {
      lockWallets: jest.fn(async (tx, walletIds: string[]) => {
        const sorted = [...new Set(walletIds)].sort();
        const rows: WalletRow[] = [];
        for (const id of sorted) {
          const w = inMemoryWallets.get(id);
          if (w) rows.push({ ...w });
        }
        return rows;
      }),
      findEntryByIdempotencyKey: jest.fn(async (tx, idempotencyKey: string) => {
        return inMemoryIdempotencyKeys.has(idempotencyKey)
          ? { entryGroupId: 'grp_idempotent_test' }
          : null;
      }),
      insertEntry: jest.fn(async (tx, data: any) => {
        inMemoryEntries.push(data);
        inMemoryEntryGroups.add(data.entryGroupId);
        const rootKey = data.idempotencyKey.split(':')[0];
        inMemoryIdempotencyKeys.add(rootKey);
        inMemoryIdempotencyKeys.add(data.idempotencyKey);
        return {
          id: `entry_${inMemoryEntries.length}`,
          ...data,
        };
      }),
      incrementWalletBalance: jest.fn(async (tx, walletId: string, delta: Prisma.Decimal) => {
        const w = inMemoryWallets.get(walletId);
        if (w) {
          w.balance = w.balance.plus(delta);
        }
      }),
      getWalletBalance: jest.fn(async (tx, walletId: string) => {
        const w = inMemoryWallets.get(walletId);
        return w ? w.balance : new Prisma.Decimal(0);
      }),
    };

    mockPrisma = {
      $transaction: jest.fn(async (cb, options) => {
        // Execute transaction block directly with mock client
        return cb({});
      }),
      wallet: {
        findUnique: jest.fn(async ({ where }) => inMemoryWallets.get(where.id) || null),
      },
    };

    ledgerService = new LedgerService(mockPrisma as any, mockRepo as LedgerRepository);
  });

  describe('Zero-Sum Mathematical Invariant Enforcement', () => {
    it('rejects an entry group with fewer than 2 postings', async () => {
      const input: PostEntryGroupInput = {
        entryGroupId: 'grp_invalid_single',
        idempotencyKey: 'idemp_single',
        postings: [
          {
            walletId: 'wallet_vendor',
            accountCode: AccountCode.VENDOR_PAYABLE,
            amount: new Prisma.Decimal(5000),
            direction: 'CREDIT',
            description: 'Single leg without matching debit',
          },
        ],
      };

      await expect(ledgerService.postEntryGroup(input)).rejects.toThrow(
        EmptyEntryGroupError,
      );
    });

    it('rejects an unbalanced entry group (credits != debits)', async () => {
      const input: PostEntryGroupInput = {
        entryGroupId: 'grp_imbalanced_01',
        idempotencyKey: 'idemp_imbalanced_01',
        postings: [
          {
            walletId: 'wallet_vendor',
            accountCode: AccountCode.VENDOR_PAYABLE,
            amount: new Prisma.Decimal(5000),
            direction: 'CREDIT',
            description: 'Vendor payment',
          },
          {
            walletId: 'wallet_escrow',
            accountCode: AccountCode.CUSTOMER_ESCROW,
            amount: new Prisma.Decimal(4500), // Discrepancy of 500 NGN
            direction: 'DEBIT',
            description: 'Customer release',
          },
        ],
      };

      await expect(ledgerService.postEntryGroup(input)).rejects.toThrow(
        LedgerImbalanceError,
      );
    });

    it('successfully posts a balanced 4-leg entry group (85% vendor, ₦800 rider, 15% platform)', async () => {
      // Order of ₦5,000 subtotal + ₦800 delivery + ₦100 fee = ₦5,900
      // Escrow Debit: ₦5,900
      // Vendor Credit: ₦4,250 (85% of ₦5,000)
      // Rider Credit: ₦800
      // Platform Credit: ₦850 (₦750 commission + ₦100 fee)
      // Sum Credits = 4250 + 800 + 850 = 5900 === Sum Debits (5900)
      const input: PostEntryGroupInput = {
        entryGroupId: 'grp_order_split_01',
        idempotencyKey: 'idemp_order_split_01',
        orderId: 'order_123',
        postings: [
          {
            walletId: 'wallet_escrow',
            accountCode: AccountCode.CUSTOMER_ESCROW,
            amount: new Prisma.Decimal(5900),
            direction: 'DEBIT',
            description: 'Release from customer escrow',
          },
          {
            walletId: 'wallet_vendor',
            accountCode: AccountCode.VENDOR_PAYABLE,
            amount: new Prisma.Decimal(4250),
            direction: 'CREDIT',
            description: 'Vendor net payout (85%)',
          },
          {
            walletId: 'wallet_rider',
            accountCode: AccountCode.RIDER_PAYABLE,
            amount: new Prisma.Decimal(800),
            direction: 'CREDIT',
            description: 'Rider trip fee',
          },
          {
            walletId: 'wallet_platform',
            accountCode: AccountCode.PLATFORM_REVENUE,
            amount: new Prisma.Decimal(850),
            direction: 'CREDIT',
            description: 'Platform take & technology fee',
          },
        ],
      };

      const result = await ledgerService.postEntryGroup(input);

      expect(result.status).toBe('POSTED');
      expect(result.entryGroupId).toBe('grp_order_split_01');
      expect(inMemoryWallets.get('wallet_vendor')?.balance.toNumber()).toBe(4250);
      expect(inMemoryWallets.get('wallet_rider')?.balance.toNumber()).toBe(800);
      expect(inMemoryWallets.get('wallet_platform')?.balance.toNumber()).toBe(850);
      expect(inMemoryWallets.get('wallet_escrow')?.balance.toNumber()).toBe(94100);
    });

    it('rejects posting if any participant wallet is locked', async () => {
      const input: PostEntryGroupInput = {
        entryGroupId: 'grp_with_locked_wallet',
        idempotencyKey: 'idemp_locked_test',
        postings: [
          {
            walletId: 'wallet_locked',
            accountCode: AccountCode.VENDOR_PAYABLE,
            amount: new Prisma.Decimal(2000),
            direction: 'CREDIT',
            description: 'Credit attempt to locked wallet',
          },
          {
            walletId: 'wallet_escrow',
            accountCode: AccountCode.CUSTOMER_ESCROW,
            amount: new Prisma.Decimal(2000),
            direction: 'DEBIT',
            description: 'Debit counterpart',
          },
        ],
      };

      await expect(ledgerService.postEntryGroup(input)).rejects.toThrow(
        WalletLockedError,
      );
    });

    it('handles idempotent retries cleanly without duplicating balances', async () => {
      const input: PostEntryGroupInput = {
        entryGroupId: 'grp_idempotent_test',
        idempotencyKey: 'idemp_key_unique_456',
        postings: [
          {
            walletId: 'wallet_escrow',
            accountCode: AccountCode.CUSTOMER_ESCROW,
            amount: new Prisma.Decimal(1000),
            direction: 'DEBIT',
            description: 'Escrow release',
          },
          {
            walletId: 'wallet_vendor',
            accountCode: AccountCode.VENDOR_PAYABLE,
            amount: new Prisma.Decimal(1000),
            direction: 'CREDIT',
            description: 'Vendor payment',
          },
        ],
      };

      // First invocation
      const firstResult = await ledgerService.postEntryGroup(input);
      expect(firstResult.status).toBe('POSTED');
      const vendorBalanceAfterFirst = inMemoryWallets.get('wallet_vendor')?.balance.toNumber();

      // Second invocation with identical group ID & idempotency key
      const secondResult = await ledgerService.postEntryGroup(input);
      expect(secondResult.status).toBe('DUPLICATE_IGNORED');

      // Balance must remain unchanged
      expect(inMemoryWallets.get('wallet_vendor')?.balance.toNumber()).toBe(vendorBalanceAfterFirst);
    });
  });

  describe('Concurrent Balanced Multi-Leg Postings', () => {
    it('executes 10 concurrent balanced postings without zero-sum drift', async () => {
      const concurrentTransfers = Array.from({ length: 10 }).map((_, i) => {
        const amount = 1000 + i * 100;
        return ledgerService.postEntryGroup({
          entryGroupId: `concurrent_grp_${i}`,
          idempotencyKey: `concurrent_idemp_${i}`,
          postings: [
            {
              walletId: 'wallet_escrow',
              accountCode: AccountCode.CUSTOMER_ESCROW,
              amount: new Prisma.Decimal(amount),
              direction: 'DEBIT',
              description: `Concurrent debit ${i}`,
            },
            {
              walletId: 'wallet_vendor',
              accountCode: AccountCode.VENDOR_PAYABLE,
              amount: new Prisma.Decimal(amount),
              direction: 'CREDIT',
              description: `Concurrent credit ${i}`,
            },
          ],
        });
      });

      const results = await Promise.all(concurrentTransfers);
      expect(results.every((r) => r.status === 'POSTED')).toBe(true);

      // Verify global invariant across all recorded entries:
      // Total Credits MUST EQUAL Total Debits
      let totalCredits = new Prisma.Decimal(0);
      let totalDebits = new Prisma.Decimal(0);

      for (const entry of inMemoryEntries) {
        if (entry.direction === 'CREDIT') {
          totalCredits = totalCredits.plus(entry.amount);
        } else {
          totalDebits = totalDebits.plus(entry.amount);
        }
      }

      expect(totalCredits.equals(totalDebits)).toBe(true);
      expect(totalCredits.toNumber()).toBe(14500); // sum(1000 + 100*i for i=0..9) = 14,500
    });
  });
});
