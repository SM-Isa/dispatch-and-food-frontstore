import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@dispatch/shared';

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
