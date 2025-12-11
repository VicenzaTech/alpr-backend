import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum FileStorageType {
    LOCAL = 'LOCAL',
    S3 = 'S3',
    MINIO = 'MINIO',
}

@Entity('files')
@Index('idx_files_storage_type', ['storageType'])
@Index('idx_files_path', ['path'])
export class FileEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ name: 'storage_type', type: 'enum', enum: FileStorageType })
    storageType: FileStorageType;

    @Column({ length: 500 })
    path: string;

    @Column({ name: 'original_name', length: 255 })
    originalName: string;

    @Column({ name: 'mime_type', length: 100, nullable: true })
    mimeType?: string;

    @Column({ name: 'size_bytes', type: 'bigint', nullable: true })
    sizeBytes?: string;

    @Column({ length: 100, nullable: true })
    checksum?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'created_by', type: 'uuid', nullable: true })
    createdById?: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by' })
    createdBy?: User;

    @OneToMany(() => FileLink, (link) => link.file)
    links?: FileLink[];
}

@Entity('file_links')
@Index('idx_file_links_entity', ['entityName', 'entityId'])
@Index('idx_file_links_file', ['fileId'])
export class FileLink {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ name: 'file_id', type: 'bigint' })
    fileId: string;

    @ManyToOne(() => FileEntity, (file) => file.links, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'file_id' })
    file: FileEntity;

    @Column({ name: 'entity_name', length: 100 })
    entityName: string;

    @Column({ name: 'entity_id', type: 'bigint' })
    entityId: string;

    @Column({ length: 50, nullable: true })
    tag?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
