import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DetectionStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('detections')
export class Detection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  plate_text: string;

  @Column({ nullable: true })
  formatted_text: string;

  @Column('float')
  confidence: number;

  @Column('float')
  detection_confidence: number;

  @Column('simple-json', { nullable: true })
  bbox: { x1: number; y1: number; x2: number; y2: number } | null;

  @Column()
  camera_id: string;

  @Column()
  sensor_id: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({
    type: 'enum',
    enum: DetectionStatus,
    default: DetectionStatus.PENDING_APPROVAL,
  })
  status: DetectionStatus;

  @Column({ nullable: true })
  full_image_url: string;

  @Column({ nullable: true })
  cropped_image_url: string;

  @Column({ nullable: true })
  image_path: string;

  @Column('simple-json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
