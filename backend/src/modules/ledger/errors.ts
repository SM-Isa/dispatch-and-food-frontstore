export class LedgerImbalanceError extends Error {
  constructor(
    public readonly entryGroupId: string,
    public readonly net: string,
  ) {
    super(`Ledger group ${entryGroupId} is unbalanced (net=${net})`);
    this.name = 'LedgerImbalanceError';
  }
}

export class LedgerDuplicateError extends Error {
  constructor(public readonly idempotencyKey: string) {
    super(`Ledger entry with idempotencyKey=${idempotencyKey} already exists`);
    this.name = 'LedgerDuplicateError';
  }
}

export class WalletNotFoundError extends Error {
  constructor(public readonly walletId: string) {
    super(`Wallet ${walletId} not found`);
    this.name = 'WalletNotFoundError';
  }
}

export class WalletLockedError extends Error {
  constructor(public readonly walletId: string) {
    super(`Wallet ${walletId} is locked`);
    this.name = 'WalletLockedError';
  }
}

export class InsufficientWalletBalanceError extends Error {
  constructor(
    public readonly walletId: string,
    public readonly available: string,
    public readonly requested: string,
  ) {
    super(
      `Wallet ${walletId} has insufficient balance (available=${available}, requested=${requested})`,
    );
    this.name = 'InsufficientWalletBalanceError';
  }
}

export class EmptyEntryGroupError extends Error {
  constructor(public readonly entryGroupId: string) {
    super(`Ledger group ${entryGroupId} must contain at least 2 postings`);
    this.name = 'EmptyEntryGroupError';
  }
}
