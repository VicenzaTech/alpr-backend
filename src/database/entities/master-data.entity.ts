import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum CustomerType {
    EXTERNAL = 'EXTERNAL',
    INTERNAL = 'INTERNAL',
    SERVICE_ONLY = 'SERVICE_ONLY',
}

export enum CustomerStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export enum VehicleType {
    CUSTOMER = 'CUSTOMER',
    INTERNAL = 'INTERNAL',
    SERVICE_ONLY = 'SERVICE_ONLY',
}

export enum MaterialUnit {
    TON = 'TON',
    M3 = 'M3',
    KG = 'KG',
}

@Entity('customers')
@Index('idx_customers_code', ['code'])
@Index('idx_customers_name', ['name'])
@Index('idx_customers_phone', ['phone'])
@Index('idx_customers_type', ['customerType'])
export class Customer {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ length: 50 })
    code: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 30, nullable: true })
    phone?: string;

    @Column({ name: 'customer_type', type: 'enum', enum: CustomerType })
    customerType: CustomerType;

    @Column({ type: 'enum', enum: CustomerStatus, default: CustomerStatus.ACTIVE })
    status: CustomerStatus;

    @Column({ type: 'text', nullable: true })
    note?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Vehicle, (vehicle) => vehicle.customer)
    vehicles?: Vehicle[];

    @OneToMany(() => MaterialPrice, (price) => price.customer)
    materialPrices?: MaterialPrice[];
}

@Entity('vehicles')
@Index('idx_vehicles_plate_norm', ['licensePlateNorm'])
@Index('idx_vehicles_customer', ['customerId'])
@Index('idx_vehicles_type', ['vehicleType'])
export class Vehicle {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ name: 'license_plate_norm', length: 50 })
    licensePlateNorm: string;

    @Column({ name: 'license_plate_raw', length: 50 })
    licensePlateRaw: string;

    @Column({ name: 'vehicle_type', type: 'enum', enum: VehicleType })
    vehicleType: VehicleType;

    @Column({ name: 'customer_id', type: 'bigint', nullable: true })
    customerId?: string;

    @ManyToOne(() => Customer, (customer) => customer.vehicles, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'customer_id' })
    customer?: Customer;

    @Column({ name: 'driver_name', length: 255, nullable: true })
    driverName?: string;

    @Column({ name: 'driver_phone', length: 30, nullable: true })
    driverPhone?: string;

    @Column({ name: 'company_name', length: 255, nullable: true })
    companyName?: string;

    @Column({ length: 20, nullable: true })
    status?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

@Entity('materials')
@Index('idx_materials_code', ['code'])
@Index('idx_materials_name', ['name'])
export class Material {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ length: 50 })
    code: string;

    @Column({ length: 255 })
    name: string;

    @Column({ type: 'enum', enum: MaterialUnit })
    unit: MaterialUnit;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => MaterialPrice, (price) => price.material)
    prices?: MaterialPrice[];
}

@Entity('material_prices')
@Index('idx_material_prices_material_customer_valid_from', [
    'materialId',
    'customerId',
    'validFrom',
])
export class MaterialPrice {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ name: 'material_id', type: 'bigint' })
    materialId: string;

    @ManyToOne(() => Material, (material) => material.prices, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'material_id' })
    material: Material;

    @Column({ name: 'customer_id', type: 'bigint', nullable: true })
    customerId?: string;

    @ManyToOne(() => Customer, (customer) => customer.materialPrices, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'customer_id' })
    customer?: Customer;

    @Column({ name: 'price_per_unit', type: 'decimal', precision: 18, scale: 2 })
    pricePerUnit: string;

    @Column({ length: 10 })
    currency: string;

    @Column({ name: 'valid_from', type: 'date' })
    validFrom: string;

    @Column({ name: 'valid_to', type: 'date', nullable: true })
    validTo?: string;

    @Column({ type: 'text', nullable: true })
    note?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
