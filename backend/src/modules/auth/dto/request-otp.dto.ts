// src/modules/auth/dto/request-otp.dto.ts
import { IsNotEmpty, IsOptional, IsString, Matches, IsIn } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'phoneNumber must be a valid E.164 formatted phone number',
  })
  phoneNumber: string;

  @IsOptional()
  @IsIn(['LOGIN', 'ORDER_CONFIRM', 'PAYOUT', 'SENSITIVE_ACTION'])
  purpose?: 'LOGIN' | 'ORDER_CONFIRM' | 'PAYOUT' | 'SENSITIVE_ACTION';
}
