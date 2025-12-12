import { Module } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer, Vehicle } from 'src/database/entities/master-data.entity';

@Module({
    controllers: [VehicleController],
    providers: [VehicleService],
    imports: [TypeOrmModule.forFeature([Vehicle, Customer])]
})
export class VehicleModule { }
