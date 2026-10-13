import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountType: 'FIXED' | 'PERCENT' | 'FREE_DELIVERY';
  discountAmount: number;
  message?: string;
}

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  // Fallback in-memory coupons if database row is not yet seeded
  private readonly defaultCoupons: Record<string, any> = {
    DISPATCH500: { discountType: 'FIXED', discountValue: 500, minOrder: 2000, maxDiscount: 500 },
    ILORIN10: { discountType: 'PERCENT', discountValue: 10, minOrder: 1500, maxDiscount: 1000 },
    FREEDELIVERY: { discountType: 'FREE_DELIVERY', discountValue: 800, minOrder: 2000, maxDiscount: 800 },
  };

  constructor(private readonly db: DatabaseService) {}

  async validateCoupon(
    rawCode: string,
    subtotal: number,
    deliveryFee: number = 800,
  ): Promise<CouponValidationResult> {
    const code = rawCode.trim().toUpperCase();

    // Query DB first
    let coupon: any = null;
    try {
      coupon = await this.db.queryOne(
        `SELECT * FROM coupons WHERE UPPER(code) = $1 AND is_active = true`,
        [code],
      );
    } catch (_) {
      // Fallback
    }

    if (!coupon && this.defaultCoupons[code]) {
      const def = this.defaultCoupons[code];
      coupon = {
        code,
        discount_type: def.discountType,
        discount_value: def.discountValue,
        min_order_value: def.minOrder,
        max_discount: def.maxDiscount,
        is_active: true,
      };
    }

    if (!coupon) {
      throw new NotFoundException(`Coupon '${code}' is invalid or has expired`);
    }

    const minOrder = parseFloat(coupon.min_order_value || '0');
    if (subtotal < minOrder) {
      throw new BadRequestException(
        `Coupon '${code}' requires a minimum order of ₦${minOrder.toFixed(0)} (current subtotal: ₦${subtotal.toFixed(0)})`,
      );
    }

    let discountAmount = 0;
    const discountVal = parseFloat(coupon.discount_value);
    const maxDiscount = coupon.max_discount ? parseFloat(coupon.max_discount) : null;

    if (coupon.discount_type === 'FIXED') {
      discountAmount = Math.min(discountVal, subtotal);
    } else if (coupon.discount_type === 'PERCENT') {
      const computed = (subtotal * discountVal) / 100;
      discountAmount = maxDiscount ? Math.min(computed, maxDiscount) : computed;
    } else if (coupon.discount_type === 'FREE_DELIVERY') {
      discountAmount = deliveryFee;
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      valid: true,
      code,
      discountType: coupon.discount_type,
      discountAmount,
      message: `Promo code ${code} applied successfully (₦${discountAmount} off)`,
    };
  }
}
