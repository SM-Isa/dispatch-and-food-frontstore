import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class FindVendorsDto {
  @IsOptional()
  @IsString()
  clusterZone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radiusMeters?: number = 5000; // default 5km

  @IsOptional()
  isOpenOnly?: boolean = true;
}
