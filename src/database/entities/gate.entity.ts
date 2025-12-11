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
import { Vehicle } from './master-data.entity';
import { User } from './user.entity';

export enum GateEventDirection {
    IN = 'IN',
    OUT = 'OUT',
}

export enum GateEventStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    DONE = 'DONE',
    FAILED = 'FAILED',
}

@Entity('cameras')
export class Camera {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ length: 50 })
    code: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255, nullable: true })
    location?: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'rtsp_url', length: 128, nullable: true })
    rtspUrl?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => GateEvent, (event) => event.camera)
    events?: GateEvent[];
}

@Entity('gate_events')
@Index('idx_gate_events_direction_captured_at', ['direction', 'capturedAt'])
@Index('idx_gate_events_vehicle_captured_at', ['vehicleId', 'capturedAt'])
@Index('idx_gate_events_plate_norm', ['licensePlateNorm'])
export class GateEvent {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ name: 'camera_id', type: 'bigint' })
    cameraId: string;

    @ManyToOne(() => Camera, (camera) => camera.events, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'camera_id' })
    camera: Camera;

    @Column({ name: 'vehicle_id', type: 'bigint', nullable: true })
    vehicleId?: string;

    @ManyToOne(() => Vehicle, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'vehicle_id' })
    vehicle?: Vehicle;

    @Column({ type: 'enum', enum: GateEventDirection })
    direction: GateEventDirection;

    @Column({ name: 'license_plate_raw', length: 50, nullable: true })
    licensePlateRaw?: string;

    @Column({ name: 'license_plate_norm', length: 50, nullable: true })
    licensePlateNorm?: string;

    @Column({
        name: 'ocr_confidence',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    })
    ocrConfidence?: string;

    @Column({ name: 'detector_model_version', length: 50, nullable: true })
    detectorModelVersion?: string;

    @Column({ name: 'ocr_model_version', length: 50, nullable: true })
    ocrModelVersion?: string;

    @Column({ name: 'overview_image_path', length: 500, nullable: true })
    overviewImagePath?: string;

    @Column({ name: 'plate_image_path', length: 500, nullable: true })
    plateImagePath?: string;

    @Column({ name: 'captured_at', type: 'timestamp' })
    capturedAt: Date;

    @Column({ name: 'is_verified', type: 'boolean', default: false })
    isVerified: boolean;

    @Column({ name: 'verified_by', type: 'uuid', nullable: true })
    verifiedById?: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'verified_by' })
    verifiedBy?: User;

    @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
    verifiedAt?: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ type: 'enum', enum: GateEventStatus, default: GateEventStatus.PENDING })
    status: GateEventStatus;
}
