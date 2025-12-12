import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseEnumPipe, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerStatus, CustomerType } from 'src/database/entities/master-data.entity';

@Controller('customer')
export class CustomerController {
    constructor(
        private readonly customerService: CustomerService,
    ) { }
    @Get()
    findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('sort') sort?: string,
        @Query('order') order?: 'ASC' | 'DESC',
        @Query('search') search?: string,
        @Query('status', new ParseEnumPipe({ enum: CustomerStatus, optional: true })) status?: CustomerStatus,
        @Query('customerType', new ParseEnumPipe({ enum: CustomerType, optional: true })) customerType?: CustomerType,
    ) {
        return this.customerService.findAll({
            page,
            limit,
            sort,
            order,
            search,
            status,
            customerType,
        })
    }

    @Get(':customerId')
    findOne(
        @Param('customerId', ParseIntPipe) customerId: number
    ) {
        return this.customerService.findOne(customerId)
    }

    @Post()
    create(@Body() dto: CreateCustomerDto) {
        return this.customerService.create(dto)
    }

    @Patch(':customerId')
    update(@Param('customerId', ParseIntPipe) customerId: number, @Body() dto: UpdateCustomerDto
    ) {
        return this.customerService.update(customerId, dto)
    }

    @Delete(':customerId')
    remove(
        @Param('customerId', ParseIntPipe) customerId: number
    ) {
        return this.customerService.remove(customerId)
    }
}
