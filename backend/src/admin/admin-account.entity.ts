import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('admin_accounts')
export class AdminAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  password_hash: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
