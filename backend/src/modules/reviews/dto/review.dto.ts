import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  vendorRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  riderRating?: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
