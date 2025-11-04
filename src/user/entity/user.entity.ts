import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
    ADMIN = 'admin',
    CREATOR = 'operator',
}

@Entity('users')
export class User {
    @PrimaryColumn('uuid') // Sử dụng ID từ Supabase làm khóa chính
    id: string;

    @Column({ unique: true, nullable: true})
    phone: string;

    @Column({ nullable: false })
    email: string;

    @Column({ nullable: false })
    fullName: string;

    @Column({ type: 'enum', enum: UserRole })
    role: UserRole;

    @Column({ nullable: false })
    position: string;

    @Column({ nullable: true })
    avatarUrl: string;

    @Column({ type: 'date', nullable: true })
    dateOfBirth: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}