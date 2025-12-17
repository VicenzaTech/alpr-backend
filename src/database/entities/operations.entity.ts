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
import {
  Customer,
  Material,
  MaterialUnit,
  Vehicle,
} from './master-data.entity';
import { GateEvent } from './gate.entity';
import { User } from './user.entity';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TicketType {
  CUSTOMER = 'CUSTOMER',
  INTERNAL = 'INTERNAL',
  SERVICE_ONLY = 'SERVICE_ONLY',
}

@Entity('scales')
export class Scale {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  location?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => WeighTicket, (ticket) => ticket.scale)
  weighTickets?: WeighTicket[];
}

@Entity('orders')
@Index('idx_orders_code', ['code'])
@Index('idx_orders_customer', ['customerId'])
@Index('idx_orders_status', ['status'])
export class Order {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ length: 50 })
  code: string;

  @Column({ name: 'customer_id', type: 'bigint' })
  customerId: string;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'contract_number', length: 100, nullable: true })
  contractNumber?: string;

  @Column({ type: 'enum', enum: OrderStatus })
  status: OrderStatus;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  totalAmount?: string;

  @Column({ length: 10, nullable: true })
  currency?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items?: OrderItem[];
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'material_id', type: 'bigint' })
  materialId: string;

  @ManyToOne(() => Material, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column({ type: 'enum', enum: MaterialUnit })
  unit: MaterialUnit;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  unitPrice?: string;

  @Column({
    name: 'quantity_planned',
    type: 'decimal',
    precision: 18,
    scale: 3,
    nullable: true,
  })
  quantityPlanned?: string;

  @Column({
    name: 'quantity_actual',
    type: 'decimal',
    precision: 18,
    scale: 3,
    nullable: true,
  })
  quantityActual?: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount?: string;
}

@Entity('weigh_tickets')
@Index('idx_weigh_tickets_vehicle', ['vehicleId'])
@Index('idx_weigh_tickets_customer', ['customerId'])
@Index('idx_weigh_tickets_order', ['orderId'])
@Index('idx_weigh_tickets_gate_in_event', ['gateInEventId'])
@Index('idx_weigh_tickets_status', ['status'])
export class WeighTicket {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ length: 50 })
  code: string;

  @Column({ name: 'ticket_type', type: 'enum', enum: TicketType })
  ticketType: TicketType;

  @Column({ name: 'vehicle_id', type: 'bigint', nullable: true })
  vehicleId?: string;

  @ManyToOne(() => Vehicle, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle;

  @Column({ name: 'customer_id', type: 'bigint', nullable: true })
  customerId?: string;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @Column({ name: 'order_id', type: 'bigint', nullable: true })
  orderId?: string;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order?: Order;

  @Column({ name: 'scale_id', type: 'bigint', nullable: true })
  scaleId?: string;

  @ManyToOne(() => Scale, (scale) => scale.weighTickets, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'scale_id' })
  scale?: Scale;

  @Column({ name: 'gate_in_event_id', type: 'bigint', nullable: true })
  gateInEventId?: string;

  @ManyToOne(() => GateEvent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'gate_in_event_id' })
  gateInEvent?: GateEvent;

  @Column({ name: 'gate_out_event_id', type: 'bigint', nullable: true })
  gateOutEventId?: string;

  @ManyToOne(() => GateEvent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'gate_out_event_id' })
  gateOutEvent?: GateEvent;

  @Column({
    name: 'gross_weight_t',
    type: 'decimal',
    precision: 18,
    scale: 3,
    nullable: true,
  })
  grossWeightT?: string;

  @Column({
    name: 'tare_weight_t',
    type: 'decimal',
    precision: 18,
    scale: 3,
    nullable: true,
  })
  tareWeightT?: string;

  @Column({
    name: 'net_weight_t',
    type: 'decimal',
    precision: 18,
    scale: 3,
    nullable: true,
  })
  netWeightT?: string;

  @Column({ length: 20, nullable: true })
  unit?: string;

  @Column({
    name: 'price_per_unit',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  pricePerUnit?: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount?: string;

  @Column({ length: 10, nullable: true })
  currency?: string;

  @Column({ name: 'first_weigh_at', type: 'timestamp', nullable: true })
  firstWeighAt?: Date;

  @Column({ name: 'second_weigh_at', type: 'timestamp', nullable: true })
  secondWeighAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ length: 30, nullable: true })
  status?: string;

  @Column({ name: 'plate_at_weigh', length: 50, nullable: true })
  plateAtWeigh?: string;

  @Column({ name: 'scale_image_path', length: 500, nullable: true })
  scaleImagePath?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updatedBy?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
