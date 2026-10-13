import {
  Controller,
  Post,
  Body,
  Headers,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaymentProvider } from '@dispatch/shared';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  async initiate(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(dto.orderId, dto.provider);
  }

  /**
   * Monnify Webhook listener endpoint
   */
  @Post('webhook/monnify')
  @HttpCode(HttpStatus.OK)
  async handleMonnifyWebhook(
    @Headers('monnify-signature') signature: string,
    @Body() payload: any,
  ) {
    const eventId = payload.transactionReference || payload.paymentReference || `MNF-${Date.now()}`;
    const eventType = payload.eventType || (payload.paymentStatus === 'PAID' ? 'payment.success' : 'other');
    return this.paymentsService.handleWebhook(
      PaymentProvider.MONNIFY,
      eventId,
      eventType,
      payload,
      true,
    );
  }

  /**
   * Korapay Webhook listener endpoint
   */
  @Post('webhook/korapay')
  @HttpCode(HttpStatus.OK)
  async handleKorapayWebhook(
    @Headers('x-korapay-signature') signature: string,
    @Body() body: any,
  ) {
    const event = body.event || 'charge.success';
    const eventId = body.data?.reference || `KRA-${Date.now()}`;
    return this.paymentsService.handleWebhook(
      PaymentProvider.KORAPAY,
      eventId,
      event,
      body.data || body,
      true,
    );
  }
}
