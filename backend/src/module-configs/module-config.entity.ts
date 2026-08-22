import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

// 얼굴분석 모듈의 "표시 설정" (전역). 측정(파이썬)과 분리된 표시 SSOT.
// axis+module_key 로 유일. 모듈번호(module_key)는 파이썬 응답 키와 동일.
@Entity('module_configs')
@Unique('uq_module_configs_axis_key', ['axis', 'module_key'])
export class ModuleConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 4 })
  axis: string; // 'WNC' | 'SNH'

  @Column({ name: 'module_key', length: 10 })
  module_key: string;

  @Column({ length: 100 })
  label: string;

  @Column({ name: 'sort_order', type: 'int', default: 999 })
  sort_order: number;

  @Column({ default: true })
  display: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
