import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CustomerStatus, CustomerType } from 'src/database/entities/master-data.entity';

export class CreateCustomerDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    code: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;

    @IsEnum(CustomerType)
    customerType: CustomerType;

    @IsOptional()
    @IsEnum(CustomerStatus)
    status?: CustomerStatus;

    @IsOptional()
    @IsString()
    note?: string;
}
