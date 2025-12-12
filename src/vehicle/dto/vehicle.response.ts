import { VehicleType } from 'src/database/entities/master-data.entity';

export type VehicleCustomerBrief = {
    id: string;
    code: string;
    name: string;
};

export type VehicleResponse = {
    id: string;
    licensePlateNorm: string;
    licensePlateRaw: string;
    vehicleType: VehicleType;
    customerId?: string;
    customer?: VehicleCustomerBrief | null;
    driverName?: string;
    driverPhone?: string;
    companyName?: string;
    status?: string;
    createdAt: Date;
    updatedAt: Date;
};
