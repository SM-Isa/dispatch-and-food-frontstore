// src/modules/auth/dto/admin-login.dto.ts
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class AdminRequestOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'phoneNumber must be a valid E.164 formatted phone number',
  })
  phoneNumber: string;
}

export class AdminVerifyLoginDto {
  @IsNotEmpty()
  @IsString()
  otpId: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otpCode: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  totpCode: string;

  @IsNotEmpty()
  @IsString()
  deviceId: string;
}

export class AdminMfaEnrollDto {
  @IsNotEmpty()
  @IsString()
  email: string;
}

export class AdminMfaConfirmDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;
}
