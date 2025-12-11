import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ name: 'entity_name', length: 100 })
    entityName: string;

    @Column({ name: 'entity_id', type: 'bigint' })
    entityId: string;

    @Column({ length: 20 })
    action: string;

    @Column({ name: 'changed_by', type: 'uuid', nullable: true })
    changedById?: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'changed_by' })
    changedBy?: User;

    @CreateDateColumn({ name: 'changed_at' })
    changedAt: Date;

    @Column({ name: 'request_id', length: 100, nullable: true })
    requestId?: string;

    @Column({ name: 'ip_address', length: 100, nullable: true })
    ipAddress?: string;

    @Column({ name: 'before_data', type: 'text', nullable: true })
    beforeData?: string;

    @Column({ name: 'after_data', type: 'text', nullable: true })
    afterData?: string;
}

@Entity('activity_logs')
@Index('idx_activity_logs_user', ['userId', 'createdAt'])
@Index('idx_activity_logs_action', ['action', 'createdAt'])
export class ActivityLog {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId?: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @Column({ length: 100 })
    action: string;

    @Column({ name: 'entity_name', length: 100, nullable: true })
    entityName?: string;

    @Column({ name: 'entity_id', type: 'bigint', nullable: true })
    entityId?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ name: 'ip_address', length: 100, nullable: true })
    ipAddress?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
