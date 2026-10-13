import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { DispatchResponse } from '@dispatch/shared';

export class RiderOfferResponseDto {
  @IsNotEmpty()
  @IsString()
  deliveryId: string;

  @IsNotEmpty()
  @IsEnum(DispatchResponse)
  response: DispatchResponse; // 'ACCEPTED' | 'REJECTED' | 'TIMED_OUT'

  @IsOptional()
  @IsString()
  reason?: string;
}
