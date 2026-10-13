import { Injectable, Logger } from '@nestjs/common';
import { Prisma, WalletType } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * WalletService resolves semantic owners → wallet IDs.
 * It caches platform-wallet IDs in memory since they never change.
 */
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private platformWalletCache = new Map<WalletType, string>();

  constructor(private readonly prisma: PrismaService) {}

  // ---------------- Platform-owned singleton wallets ----------------

  async getEscrowWalletId(): Promise<string> {
    return this.getPlatformWallet(WalletType.CUSTOMER_ESCROW);
  }

  async getPlatformWalletId(): Promise<string> {
    return this.getPlatformWallet(WalletType.PLATFORM);
  }

  async getRiderPoolWalletId(): Promise<string> {
    return this.getPlatformWallet(WalletType.RIDER_POOL);
  }

  async getRefundPoolWalletId(): Promise<string> {
    return this.getPlatformWallet(WalletType.REFUND_POOL);
  }

  async getPayoutInTransitWalletId(): Promise<string> {
    return this.getPlatformWallet(WalletType.PAYOUT_IN_TRANSIT);
  }

  async getBankSettlementWalletId(): Promise<string> {
    return this.getPlatformWallet(WalletType.BANK_SETTLEMENT);
  }

  async getPlatformLossWalletId(): Promise<string> {
    return this.getPlatformWallet(WalletType.PLATFORM_LOSS);
  }

  // ---------------- Owner-scoped wallets ----------------

  async getVendorWalletId(vendorId: string): Promise<string> {
    return this.getOwnerWalletId(vendorId, WalletType.VENDOR);
  }

  async getRiderWalletId(riderId: string): Promise<string> {
    return this.getOwnerWalletId(riderId, WalletType.RIDER);
  }

  async getCustomerWalletId(customerId: string): Promise<string> {
    return this.getOwnerWalletId(customerId, WalletType.CUSTOMER_ESCROW);
  }

  // ---------------- Internal ----------------

  private async getPlatformWallet(type: WalletType): Promise<string> {
    const cached = this.platformWalletCache.get(type);
    if (cached) return cached;

    const wallet = await this.prisma.wallet.findFirst({
      where: { ledgerType: type, ownerId: null },
      select: { id: true },
    });

    if (!wallet) {
      // Create lazily if not yet seeded
      const created = await this.prisma.wallet.create({
        data: {
          ledgerType: type,
          currency: 'NGN',
          balance: new Prisma.Decimal(0),
        },
        select: { id: true },
      });
      this.platformWalletCache.set(type, created.id);
      return created.id;
    }

    this.platformWalletCache.set(type, wallet.id);
    return wallet.id;
  }

  private async getOwnerWalletId(
    ownerId: string,
    type: WalletType,
  ): Promise<string> {
    const wallet = await this.prisma.wallet.findFirst({
      where: { ownerId, ledgerType: type },
      select: { id: true },
    });

    if (!wallet) {
      return this.createOwnerWallet(ownerId, type);
    }

    return wallet.id;
  }

  private async createOwnerWallet(
    ownerId: string,
    type: WalletType,
  ): Promise<string> {
    this.logger.log(`Creating wallet lazily: owner=${ownerId} type=${type}`);
    const wallet = await this.prisma.wallet.create({
      data: {
        ownerId,
        ledgerType: type,
        currency: 'NGN',
        balance: new Prisma.Decimal(0),
      },
      select: { id: true },
    });
    return wallet.id;
  }
}
