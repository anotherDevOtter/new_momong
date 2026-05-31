import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../auth/users.entity';
import { Customer } from '../customers/customers.entity';

@Entity('pre_surveys')
export class PreSurvey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'customer_id' })
  customer_id: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Index({ unique: true })
  @Column({ length: 64 })
  token: string;

  @Column({ type: 'jsonb', default: {} })
  answers: Record<string, unknown>;

  @Column({ name: 'filled_at', type: 'timestamp', nullable: true })
  filled_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
