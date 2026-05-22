import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../auth/users.entity';
import { Customer } from '../customers/customers.entity';

export type DetectionType = 'WNC' | 'SNH';

/**
 * 얼굴 분석 결과 (face_landmark Python 서버 분석 결과 보관)
 * 한 번의 분석 호출 시 WNC + SNH 두 행을 만든다.
 *
 * 참고: 옛 momong_backend 의 image_detection_results 테이블(detection_type_id FK,
 * detected_by_manager_id 등 다른 스키마) 과 충돌하지 않도록 별도 테이블명 사용.
 */
@Entity('face_analysis_results')
export class ImageDetectionResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  user_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'customer_id', nullable: true })
  customer_id: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  @Column({ name: 'detection_type', length: 10 })
  detection_type: DetectionType;

  @Column({ name: 'face_image_url', length: 1000 })
  face_image_url: string;

  /** Python 서버의 wnc 또는 snh 결과 객체 */
  @Column({ name: 'python_analysis_result', type: 'jsonb' })
  python_analysis_result: Record<string, unknown>;

  /** 클라이언트(디자이너)가 직접 입력한 보조 데이터 (예: snh7, snh8) */
  @Column({ name: 'client_provided_data', type: 'jsonb', nullable: true })
  client_provided_data: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'detected_at' })
  detected_at: Date;
}
