import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../auth/users.entity';
import { Customer } from '../customers/customers.entity';

@Entity('consultations')
export class Consultation {
  @PrimaryColumn({ length: 50 })
  id: string;

  @Column({ name: 'user_id', nullable: true })
  user_id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'customer_id', nullable: true })
  customer_id: string;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'visit_date', length: 20 })
  visit_date: string;

  @Column({ name: 'designer_name', length: 100, nullable: true })
  designer_name: string;

  @Column({ name: 'after_note', type: 'text', nullable: true })
  after_note: string;

  @Column({ name: 'client_info', type: 'jsonb' })
  client_info: Record<string, any>;

  @Column({ name: 'today_keyword', type: 'jsonb', default: '{}' })
  today_keyword: Record<string, any>;

  @Column({ name: 'fashion_style', type: 'jsonb', default: '{}' })
  fashion_style: Record<string, any>;

  @Column({ name: 'face_image_type', type: 'jsonb', default: '{}' })
  face_image_type: Record<string, any>;

  @Column({ name: 'hair_condition', type: 'jsonb', default: '{}' })
  hair_condition: Record<string, any>;

  @Column({ name: 'hair_style_proposal', type: 'jsonb', default: '{}' })
  hair_style_proposal: Record<string, any>;

  @Column({ name: 'today_design', type: 'jsonb', default: '{}' })
  today_design: Record<string, any>;

  @Column({ name: 'next_direction', type: 'jsonb', default: '{}' })
  next_direction: Record<string, any>;

  @Column({ name: 'design_cycle_guide', type: 'jsonb', default: '{}' })
  design_cycle_guide: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
