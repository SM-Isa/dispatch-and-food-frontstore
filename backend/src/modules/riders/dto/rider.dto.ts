import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateRiderProfileDto {
  @IsNotEmpty()
  @IsString()
  vehicleType: string; // 'BAJAJ_BOXER_150', 'TVS_HLX_125', etc.

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsNotEmpty()
  @IsString()
  guarantorName: string;

  @IsNotEmpty()
  @IsString()
  guarantorPhone: string;

  @IsOptional()
  @IsString()
  currentCluster?: string = 'TANKE';
}

export class HeartbeatDto {
  @IsNotEmpty()
  latitude: number;

  @IsNotEmpty()
  longitude: number;

  @IsOptional()
  @IsString()
  cluster?: string;
}
