import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum LoginLogStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

@Entity('roles')
@Index('idx_roles_code', ['code'])
export class Role {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number;

    @Column({ length: 50 })
    code: string;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @OneToMany(() => UserRoleAssignment, (assignment) => assignment.role)
    userRoles?: UserRoleAssignment[];
}

@Entity('user_roles')
@Index('idx_user_roles_user', ['userId'])
@Index('idx_user_roles_role', ['roleId'])
export class UserRoleAssignment {
    @PrimaryColumn({ name: 'user_id', type: 'uuid' })
    userId: string;

    @PrimaryColumn({ name: 'role_id', type: 'int' })
    roleId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}

@Entity('login_logs')
@Index('idx_login_logs_user_logged_at', ['userId', 'loggedAt'])
@Index('idx_login_logs_status_logged_at', ['status', 'loggedAt'])
export class LoginLog {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId?: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @Column({ length: 100, nullable: true })
    username?: string;

    @Column({ name: 'ip_address', length: 100, nullable: true })
    ipAddress?: string;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent?: string;

    @Column({ type: 'enum', enum: LoginLogStatus })
    status: LoginLogStatus;

    @Column({ type: 'text', nullable: true })
    reason?: string;

    @Column({ name: 'logged_at', type: 'timestamp' })
    loggedAt: Date;
}
