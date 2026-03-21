import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Consultation } from '../consultations/consultations.entity';

@Entity('consultation_shares')
export class ConsultationShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 64 })
  token: string;

  @Column({ name: 'consultation_id', length: 50 })
  consultation_id: string;

  @ManyToOne(() => Consultation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultation_id' })
  consultation: Consultation;

  @Column({ name: 'password_hash' })
  password_hash: string;

  @Column({ name: 'password_plain', nullable: true })
  password_plain: string;

  @Column({ name: 'expires_at', nullable: true })
  expires_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
