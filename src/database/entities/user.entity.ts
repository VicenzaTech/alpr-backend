import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  CREATOR = 'operator',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
}

@Entity('users')
@Index('idx_users_email', ['email'])
@Index('idx_users_phone', ['phone'])
@Index('idx_users_username', ['username'])
export class User {
  @PrimaryColumn('uuid') // Use Supabase user id as the primary key
  id: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  username?: string;

  @Column({ nullable: false })
  email: string;

  @Column({ name: 'full_name', nullable: false, default: '' })
  fullName: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash?: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: false })
  position: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
