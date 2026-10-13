import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { CouponsService } from './coupons.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  async validate(
    @Body('code') code: string,
    @Body('subtotal') subtotal: number,
    @Body('deliveryFee') deliveryFee?: number,
  ) {
    if (!code) {
      throw new BadRequestException('Coupon code is required');
    }
    return this.couponsService.validateCoupon(
      code,
      subtotal || 0,
      deliveryFee !== undefined ? deliveryFee : 800,
    );
  }
}
