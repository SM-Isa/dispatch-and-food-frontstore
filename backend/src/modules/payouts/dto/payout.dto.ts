import { IsNotEmpty, IsNumber, IsString, Min, IsOptional } from 'class-validator';

export class RequestPayoutDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(500)
  amount: number;

  @IsNotEmpty()
  @IsString()
  bankCode: string;

  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @IsNotEmpty()
  @IsString()
  accountName: string;

  @IsOptional()
  @IsString()
  provider?: string = 'MONNIFY';
}
