import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureSettings } from './feature-settings.entity';

const SINGLETON_ID = 1;

export interface FeatureSettingsDto {
  fitEnabled: boolean;
  threeWayEnabled: boolean;
  courses: {
    '1way': boolean;
    '2way-personal': boolean;
    '2way-skeleton': boolean;
    '3way': boolean;
  };
}

@Injectable()
export class FeatureSettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(FeatureSettings)
    private readonly repo: Repository<FeatureSettings>,
  ) {}

  async onModuleInit(): Promise<void> {
    const existing = await this.repo.findOne({ where: { id: SINGLETON_ID } });
    if (!existing) {
      await this.repo.save(this.repo.create({ id: SINGLETON_ID }));
    }
  }

  private toDto(entity: FeatureSettings): FeatureSettingsDto {
    return {
      fitEnabled: entity.fit_enabled,
      threeWayEnabled: entity.three_way_enabled,
      courses: {
        '1way': entity.course_1way_enabled,
        '2way-personal': entity.course_2way_personal_enabled,
        '2way-skeleton': entity.course_2way_skeleton_enabled,
        '3way': entity.course_3way_enabled,
      },
    };
  }

  private async loadOrCreate(): Promise<FeatureSettings> {
    let entity = await this.repo.findOne({ where: { id: SINGLETON_ID } });
    if (!entity) {
      entity = await this.repo.save(this.repo.create({ id: SINGLETON_ID }));
    }
    return entity;
  }

  async get(): Promise<FeatureSettingsDto> {
    const entity = await this.loadOrCreate();
    return this.toDto(entity);
  }

  async update(patch: Partial<FeatureSettingsDto>): Promise<FeatureSettingsDto> {
    const entity = await this.loadOrCreate();

    if (patch.fitEnabled !== undefined) entity.fit_enabled = patch.fitEnabled;
    if (patch.threeWayEnabled !== undefined) entity.three_way_enabled = patch.threeWayEnabled;

    if (patch.courses) {
      if (patch.courses['1way'] !== undefined) entity.course_1way_enabled = patch.courses['1way'];
      if (patch.courses['2way-personal'] !== undefined)
        entity.course_2way_personal_enabled = patch.courses['2way-personal'];
      if (patch.courses['2way-skeleton'] !== undefined)
        entity.course_2way_skeleton_enabled = patch.courses['2way-skeleton'];
      if (patch.courses['3way'] !== undefined) entity.course_3way_enabled = patch.courses['3way'];
    }

    const saved = await this.repo.save(entity);
    return this.toDto(saved);
  }
}
