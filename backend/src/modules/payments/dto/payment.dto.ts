import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { PaymentProvider } from '@dispatch/shared';

export class InitiatePaymentDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider = PaymentProvider.MONNIFY;
}

export class WebhookPayloadDto {
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsNotEmpty()
  @IsString()
  eventType: string; // 'payment.success', etc.

  @IsNotEmpty()
  payload: Record<string, any>;
}
