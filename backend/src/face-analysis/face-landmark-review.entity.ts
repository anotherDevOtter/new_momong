import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type LandmarkVerdict = 'ok' | 'bad';

/** 틀린 부위 — admin 검수 화면의 체크 항목과 같다 */
export const LANDMARK_PARTS = ['contour', 'brow', 'eye', 'iris', 'nose', 'lips', 'other'] as const;
export type LandmarkPart = (typeof LANDMARK_PARTS)[number];

/**
 * 랜드마크 검수 (migrations/007). 사진 한 장 = 한 행.
 * 사진 단위로 짝짓는 face_analysis_results 와 같은 키(face_image_url)를 쓴다.
 */
@Entity('face_landmark_reviews')
export class FaceLandmarkReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'face_image_url', length: 1000, unique: true })
  face_image_url: string;

  @Column({ name: 'verdict', length: 10 })
  verdict: LandmarkVerdict;

  @Column({ name: 'bad_parts', type: 'jsonb', default: () => "'[]'" })
  bad_parts: LandmarkPart[];

  @Column({ name: 'note', type: 'text', nullable: true })
  note: string | null;

  @UpdateDateColumn({ name: 'reviewed_at' })
  reviewed_at: Date;
}
