import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('feature_settings')
export class FeatureSettings {
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ name: 'fit_enabled', default: true })
  fit_enabled: boolean;

  @Column({ name: 'three_way_enabled', default: true })
  three_way_enabled: boolean;

  @Column({ name: 'course_1way_enabled', default: true })
  course_1way_enabled: boolean;

  @Column({ name: 'course_2way_personal_enabled', default: true })
  course_2way_personal_enabled: boolean;

  @Column({ name: 'course_2way_skeleton_enabled', default: true })
  course_2way_skeleton_enabled: boolean;

  @Column({ name: 'course_3way_enabled', default: true })
  course_3way_enabled: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
