import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get('active/me')
  @UseGuards(JwtAuthGuard)
  async getActiveDelivery(@CurrentUser() user: any) {
    return this.deliveriesService.getActiveDeliveryForRider(user.sub);
  }

  @Patch(':id/pickup')
  @UseGuards(JwtAuthGuard)
  async markPickedUp(@Param('id') id: string, @CurrentUser() user: any) {
    return this.deliveriesService.markPickedUp(id, user.sub);
  }

  @Patch(':id/delivered')
  @UseGuards(JwtAuthGuard)
  async markDelivered(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('proofImageUrl') proofImageUrl?: string,
  ) {
    return this.deliveriesService.markDelivered(id, user.sub, proofImageUrl);
  }
}
