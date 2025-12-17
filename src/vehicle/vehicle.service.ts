import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Customer,
  Vehicle,
  VehicleType,
} from 'src/database/entities/master-data.entity';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleResponse } from './dto/vehicle.response';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
    search?: string;
    vehicleType?: VehicleType;
    customerId?: number;
  }): Promise<PaginatedResult<VehicleResponse>> {
    const {
      page = 1,
      limit = 20,
      sort,
      order,
      search,
      vehicleType,
      customerId,
    } = params;

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.floor(limit), 1), 100)
      : 20;
    const skip = (safePage - 1) * safeLimit;

    const vehicleSortFields = [
      'licensePlateNorm',
      'createdAt',
      'updatedAt',
    ] as const;
    type VehicleSortField = (typeof vehicleSortFields)[number];
    const candidateSort = sort as VehicleSortField | undefined;
    const sortField: VehicleSortField =
      candidateSort && vehicleSortFields.includes(candidateSort)
        ? candidateSort
        : 'createdAt';
    const sortOrder: 'ASC' | 'DESC' =
      order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.customer', 'customer');

    if (search) {
      qb.andWhere(
        '(LOWER(vehicle.licensePlateNorm) LIKE :search OR LOWER(vehicle.licensePlateRaw) LIKE :search OR LOWER(vehicle.driverName) LIKE :search OR LOWER(vehicle.driverPhone) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    if (vehicleType) {
      qb.andWhere('vehicle.vehicleType = :vehicleType', { vehicleType });
    }

    if (customerId && customerId > 0) {
      qb.andWhere('vehicle.customerId = :customerId', {
        customerId: customerId.toString(),
      });
    }

    qb.orderBy(`vehicle.${sortField}`, sortOrder).skip(skip).take(safeLimit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((item) => this.mapVehicleResponse(item)),
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      },
    };
  }

  async findOne(vehicleId: number): Promise<VehicleResponse> {
    const vehicle = await this.ensureVehicleExists(vehicleId, true);
    return this.mapVehicleResponse(vehicle);
  }

  async create(dto: CreateVehicleDto): Promise<VehicleResponse> {
    const normalizedPlate = this.normalizePlate(dto.licensePlateNorm);
    await this.ensureLicensePlateUnique(normalizedPlate);

    const customer = await this.resolveCustomer(dto.customerId);

    const newVehicle = this.vehicleRepository.create({
      ...dto,
      licensePlateNorm: normalizedPlate,
      licensePlateRaw: dto.licensePlateRaw.trim(),
      customerId: customer?.id,
      customer: customer ?? undefined,
      driverName: dto.driverName?.trim(),
      driverPhone: dto.driverPhone?.trim(),
      companyName: dto.companyName?.trim(),
      status: dto.status?.trim(),
    });

    const saved = await this.vehicleRepository.save(newVehicle);
    const withRelations = await this.vehicleRepository.findOne({
      where: { id: saved.id },
      relations: ['customer'],
    });

    return this.mapVehicleResponse(withRelations ?? saved);
  }

  async update(
    vehicleId: number,
    dto: UpdateVehicleDto,
  ): Promise<VehicleResponse> {
    const vehicle = await this.ensureVehicleExists(vehicleId, true);

    if (dto.licensePlateNorm) {
      const normalizedPlate = this.normalizePlate(dto.licensePlateNorm);
      if (normalizedPlate !== vehicle.licensePlateNorm) {
        await this.ensureLicensePlateUnique(normalizedPlate, vehicle.id);
      }
      vehicle.licensePlateNorm = normalizedPlate;
    }

    if (dto.licensePlateRaw) {
      vehicle.licensePlateRaw = dto.licensePlateRaw.trim();
    }

    if (dto.vehicleType) {
      vehicle.vehicleType = dto.vehicleType;
    }

    if (dto.driverName !== undefined) {
      vehicle.driverName = dto.driverName?.trim();
    }

    if (dto.driverPhone !== undefined) {
      vehicle.driverPhone = dto.driverPhone?.trim();
    }

    if (dto.companyName !== undefined) {
      vehicle.companyName = dto.companyName?.trim();
    }

    if (dto.status !== undefined) {
      vehicle.status = dto.status?.trim();
    }

    if (dto.customerId !== undefined) {
      const customer = await this.resolveCustomer(dto.customerId);
      vehicle.customerId = customer?.id;
      vehicle.customer = customer ?? null;
    }

    const saved = await this.vehicleRepository.save(vehicle);
    const withRelations = await this.vehicleRepository.findOne({
      where: { id: saved.id },
      relations: ['customer'],
    });
    return this.mapVehicleResponse(withRelations ?? saved);
  }

  async remove(vehicleId: number): Promise<{ success: boolean }> {
    await this.ensureVehicleExists(vehicleId);
    await this.vehicleRepository.delete({ id: vehicleId.toString() });
    return { success: true };
  }

  private async ensureVehicleExists(
    vehicleId: number,
    withCustomer = false,
  ): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId.toString() },
      relations: withCustomer ? ['customer'] : undefined,
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle #${vehicleId} not found`);
    }

    return vehicle;
  }

  private async ensureLicensePlateUnique(
    licensePlateNorm: string,
    ignoreId?: string,
  ) {
    const existing = await this.vehicleRepository.findOne({
      where: { licensePlateNorm },
    });

    if (existing && existing.id !== ignoreId) {
      throw new BadRequestException(
        `Vehicle ${licensePlateNorm} already exists`,
      );
    }
  }

  private async resolveCustomer(
    customerId?: number | null,
  ): Promise<Customer | null> {
    if (!customerId || customerId <= 0) {
      return null;
    }

    const customer = await this.customerRepository.findOne({
      where: { id: customerId.toString() },
    });

    if (!customer) {
      throw new BadRequestException(`Customer #${customerId} not found`);
    }

    return customer;
  }

  private normalizePlate(value: string): string {
    return value.replace(/\s+/g, '').toUpperCase();
  }

  private mapVehicleResponse(vehicle: Vehicle): VehicleResponse {
    return {
      id: vehicle.id,
      licensePlateNorm: vehicle.licensePlateNorm,
      licensePlateRaw: vehicle.licensePlateRaw,
      vehicleType: vehicle.vehicleType,
      customerId: (vehicle.customerId ?? vehicle.customer?.id) || undefined,
      customer: vehicle.customer
        ? {
            id: vehicle.customer.id,
            code: vehicle.customer.code,
            name: vehicle.customer.name,
          }
        : null,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      companyName: vehicle.companyName,
      status: vehicle.status,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }
}
