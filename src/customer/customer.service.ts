import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Customer,
  CustomerStatus,
  CustomerType,
} from 'src/database/entities/master-data.entity';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponse } from './dto/customer.response';

type CustomerListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
};

const CUSTOMER_SORTABLE_FIELDS = [
  'code',
  'name',
  'createdAt',
  'updatedAt',
] as const;
type CustomerSortField = (typeof CUSTOMER_SORTABLE_FIELDS)[number];

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>, // <-- ensure this is injected like this
  ) {}

  async findAll(
    params: CustomerListParams,
  ): Promise<PaginatedResult<CustomerResponse>> {
    const {
      page = 1,
      limit = 20,
      sort,
      order,
      search,
      status,
      customerType,
    } = params;

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.floor(limit), 1), 100)
      : 20;
    const skip = (safePage - 1) * safeLimit;

    const candidateSort = sort as CustomerSortField | undefined;
    const sortField: CustomerSortField =
      candidateSort && CUSTOMER_SORTABLE_FIELDS.includes(candidateSort)
        ? candidateSort
        : 'createdAt';
    const sortOrder: 'ASC' | 'DESC' =
      order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.customerRepository.createQueryBuilder('customer');

    if (search) {
      qb.andWhere(
        '(LOWER(customer.code) LIKE :search OR LOWER(customer.name) LIKE :search OR LOWER(customer.phone) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    if (status) {
      qb.andWhere('customer.status = :status', { status });
    }

    if (customerType) {
      qb.andWhere('customer.customerType = :customerType', { customerType });
    }

    qb.orderBy(`customer.${sortField}`, sortOrder).skip(skip).take(safeLimit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((item) => this.mapCustomerResponse(item)),
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      },
    };
  }

  async findOne(customerId: number): Promise<CustomerResponse> {
    const customer = await this.ensureCustomerExists(customerId, true);
    return this.mapCustomerResponse(customer);
  }

  async create(dto: CreateCustomerDto): Promise<CustomerResponse> {
    const normalizedCode = dto.code.trim().toUpperCase();
    await this.ensureCustomerCodeUnique(normalizedCode);

    const newCustomer = this.customerRepository.create({
      ...dto,
      code: normalizedCode,
      name: dto.name.trim(),
      phone: dto.phone?.trim(),
      note: dto.note?.trim(),
      status: dto.status ?? CustomerStatus.ACTIVE,
    });

    const saved = await this.customerRepository.save(newCustomer);
    return this.mapCustomerResponse(saved);
  }

  async update(
    customerId: number,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponse> {
    const customer = await this.ensureCustomerExists(customerId);

    if (dto.code) {
      const normalizedCode = dto.code.trim().toUpperCase();
      if (normalizedCode !== customer.code) {
        await this.ensureCustomerCodeUnique(normalizedCode, customer.id);
      }
      customer.code = normalizedCode;
    }

    if (dto.name !== undefined) {
      customer.name = dto.name.trim();
    }

    if (dto.phone !== undefined) {
      customer.phone = dto.phone?.trim();
    }

    if (dto.customerType) {
      customer.customerType = dto.customerType;
    }

    if (dto.status) {
      customer.status = dto.status;
    }

    if (dto.note !== undefined) {
      customer.note = dto.note?.trim();
    }

    const saved = await this.customerRepository.save(customer);
    return this.mapCustomerResponse(saved);
  }

  async remove(customerId: number): Promise<{ success: boolean }> {
    await this.ensureCustomerExists(customerId);
    await this.customerRepository.delete({ id: customerId.toString() });
    return { success: true };
  }

  private async ensureCustomerExists(
    customerId: number,
    withRelations = false,
  ): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId.toString() },
      relations: withRelations ? ['vehicles'] : undefined,
    });

    if (!customer) {
      throw new NotFoundException(`Customer #${customerId} not found`);
    }

    return customer;
  }

  private async ensureCustomerCodeUnique(code: string, ignoreId?: string) {
    const existing = await this.customerRepository.findOne({
      where: {
        code,
      },
    });

    if (existing && existing.id !== ignoreId) {
      throw new BadRequestException(`Customer code ${code} already exists`);
    }
  }

  private mapCustomerResponse(customer: Customer): CustomerResponse {
    return {
      id: customer.id,
      code: customer.code,
      name: customer.name,
      phone: customer.phone,
      customerType: customer.customerType,
      status: customer.status,
      note: customer.note,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      vehicles: customer.vehicles?.map((vehicle) => ({
        id: vehicle.id,
        licensePlateNorm: vehicle.licensePlateNorm,
        vehicleType: vehicle.vehicleType,
        status: vehicle.status,
      })),
    };
  }
}
