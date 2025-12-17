import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleType } from 'src/database/entities/master-data.entity';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('search') search?: string,
    @Query(
      'vehicleType',
      new ParseEnumPipe({ enum: VehicleType, optional: true }),
    )
    vehicleType?: VehicleType,
    @Query('customerId') customerId?: string,
  ) {
    const normalizedCustomerId =
      customerId && !Number.isNaN(Number(customerId))
        ? Number(customerId)
        : undefined;
    return this.vehicleService.findAll({
      page,
      limit,
      sort,
      order,
      search,
      vehicleType,
      customerId: normalizedCustomerId,
    });
  }

  @Get(':vehicleId')
  findOne(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.vehicleService.findOne(vehicleId);
  }

  @Post()
  create(@Body() dto: CreateVehicleDto) {
    return this.vehicleService.create(dto);
  }

  @Patch(':vehicleId')
  update(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicleService.update(vehicleId, dto);
  }

  @Delete(':vehicleId')
  remove(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.vehicleService.remove(vehicleId);
  }
}
