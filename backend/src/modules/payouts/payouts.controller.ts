import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { RequestPayoutDto } from './dto/payout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  async requestPayout(@CurrentUser() user: any, @Body() dto: RequestPayoutDto) {
    return this.payoutsService.requestPayout(user.sub, dto);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@CurrentUser() user: any) {
    return this.payoutsService.getPayoutHistory(user.sub);
  }
}
