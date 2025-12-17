import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum SystemSettingCategory {
  GENERAL = 'GENERAL',
  WEIGHT = 'WEIGHT',
  REPORT = 'REPORT',
  SECURITY = 'SECURITY',
}

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ length: 100 })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: SystemSettingCategory,
    default: SystemSettingCategory.GENERAL,
  })
  category: SystemSettingCategory;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updatedBy?: User;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
