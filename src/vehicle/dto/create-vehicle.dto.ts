import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { VehicleType } from 'src/database/entities/master-data.entity';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  licensePlateNorm: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  licensePlateRaw: string;

  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  driverName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  driverPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}
