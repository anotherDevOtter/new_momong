import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ name: 'store_name', length: 100, default: '' })
  store_name: string;

  @Column({ name: 'owner_name', length: 100, default: '' })
  owner_name: string;

  @Column({ name: 'password_hash' })
  password_hash: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ default: 'approved' })
  status: 'pending' | 'approved' | 'rejected';

  @Column({ default: 'user' })
  role: 'user' | 'admin';

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
