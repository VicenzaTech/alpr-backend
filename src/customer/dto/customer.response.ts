import { CustomerStatus, CustomerType, VehicleType } from 'src/database/entities/master-data.entity';

export type CustomerVehicleSummary = {
    id: string;
    licensePlateNorm: string;
    vehicleType: VehicleType;
    status?: string;
};

export type CustomerResponse = {
    id: string;
    code: string;
    name: string;
    phone?: string;
    customerType: CustomerType;
    status: CustomerStatus;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
    vehicles?: CustomerVehicleSummary[];
};
