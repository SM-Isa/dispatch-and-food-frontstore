import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { OffersService } from './offers.service';
import { DispatchEngine } from './dispatch.engine';
import { RiderOfferResponseDto } from './dto/dispatch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DispatchResponse } from '@dispatch/shared';

@Controller('dispatch')
export class DispatchController {
  constructor(
    private readonly dispatchService: DispatchService,
    private readonly dispatchEngine: DispatchEngine,
    private readonly offersService: OffersService,
  ) {}

  @Post('trigger/:deliveryId')
  @UseGuards(JwtAuthGuard)
  async matchAndDispatch(@Param('deliveryId') deliveryId: string) {
    return this.dispatchEngine.beginDispatch(deliveryId);
  }

  @Post('offers/:offerId/accept')
  @UseGuards(JwtAuthGuard)
  async acceptOffer(
    @Param('offerId') offerId: string,
    @Body('deliveryId') deliveryId: string,
    @CurrentUser() user: any,
  ) {
    return this.offersService.acceptOffer(deliveryId, offerId, user.sub);
  }

  @Post('offers/:offerId/reject')
  @UseGuards(JwtAuthGuard)
  async rejectOffer(
    @Param('offerId') offerId: string,
    @Body('deliveryId') deliveryId: string,
    @CurrentUser() user: any,
  ) {
    return this.offersService.rejectOffer(deliveryId, offerId, user.sub);
  }

  @Post('respond')
  @UseGuards(JwtAuthGuard)
  async respondToOffer(@CurrentUser() user: any, @Body() dto: RiderOfferResponseDto) {
    return this.dispatchService.respondToOffer(user.sub, dto);
  }

  @Get('my-offers')
  @UseGuards(JwtAuthGuard)
  async getMyOffers(@CurrentUser() user: any) {
    return this.dispatchService.getActiveOffersForRider(user.sub);
  }
}
