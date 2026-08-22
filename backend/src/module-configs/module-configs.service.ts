import { Injectable, OnModuleInit, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleConfig } from './module-config.entity';

export interface ModuleConfigDto {
  id: string;
  axis: string;
  moduleKey: string;
  label: string;
  order: number;
  display: boolean;
  unit: string | null;
}

type SeedRow = {
  axis: 'WNC' | 'SNH';
  module_key: string;
  label: string;
  sort_order: number;
  display: boolean;
  unit: string | null;
};

// 초기 시드 — 현재 파이썬 레지스트리(face_landmark/analyze_face.py) 24개 모듈.
// 쓰는 13개 = display:true (디자이너 라벨/순서). 나머지 11개 = display:false (서버 name).
// SNH 7·8 은 오래 미등록 상태였다가 2026-08-22 에 레지스트리에 복구됨 → 숨김으로 시드.
const SEED: SeedRow[] = [
  // ── WNC (10) ──
  { axis: 'WNC', module_key: '1', label: '피부톤', sort_order: 10, display: true, unit: null },
  { axis: 'WNC', module_key: '2', label: '페이스라인', sort_order: 20, display: true, unit: null },
  { axis: 'WNC', module_key: '3', label: '광대 발달 정도', sort_order: 30, display: true, unit: null },
  { axis: 'WNC', module_key: '5', label: '눈썹 형태', sort_order: 40, display: true, unit: null },
  { axis: 'WNC', module_key: '6', label: '눈 형태', sort_order: 50, display: true, unit: null },
  { axis: 'WNC', module_key: '8', label: '코 형태', sort_order: 60, display: true, unit: null },
  { axis: 'WNC', module_key: '9', label: '입술 형태', sort_order: 70, display: true, unit: null },
  { axis: 'WNC', module_key: '4', label: '윤곽라인', sort_order: 110, display: false, unit: null },
  { axis: 'WNC', module_key: '7', label: '눈꼬리 각도', sort_order: 120, display: false, unit: null },
  { axis: 'WNC', module_key: '10', label: '입술산 형태', sort_order: 130, display: false, unit: null },
  // ── SNH (14) ──
  { axis: 'SNH', module_key: '2', label: '얼굴 길이', sort_order: 10, display: true, unit: ':1' },
  { axis: 'SNH', module_key: '4', label: '눈썹과 눈 거리', sort_order: 20, display: true, unit: null },
  { axis: 'SNH', module_key: '5', label: '눈과 눈사이 거리', sort_order: 30, display: true, unit: null },
  { axis: 'SNH', module_key: '11', label: '중안부', sort_order: 40, display: true, unit: ':1' },
  { axis: 'SNH', module_key: '10', label: '코 폭', sort_order: 50, display: true, unit: null },
  { axis: 'SNH', module_key: '13', label: '입 폭', sort_order: 60, display: true, unit: null },
  { axis: 'SNH', module_key: '1', label: '피부톤(밝기)', sort_order: 110, display: false, unit: null },
  { axis: 'SNH', module_key: '3', label: '눈썹 두께', sort_order: 120, display: false, unit: null },
  { axis: 'SNH', module_key: '6', label: '눈 바깥 여백', sort_order: 130, display: false, unit: null },
  { axis: 'SNH', module_key: '9', label: '코 길이', sort_order: 140, display: false, unit: null },
  { axis: 'SNH', module_key: '12', label: '인중 길이', sort_order: 150, display: false, unit: null },
  { axis: 'SNH', module_key: '14', label: '턱 길이', sort_order: 160, display: false, unit: null },
  { axis: 'SNH', module_key: '7', label: '쌍꺼풀 형태', sort_order: 170, display: false, unit: null },
  { axis: 'SNH', module_key: '8', label: '눈 밑 지방', sort_order: 180, display: false, unit: 'px' },
];

@Injectable()
export class ModuleConfigsService implements OnModuleInit {
  private readonly logger = new Logger(ModuleConfigsService.name);

  constructor(
    @InjectRepository(ModuleConfig)
    private readonly repo: Repository<ModuleConfig>,
  ) {}

  // 비어있으면 시드 (dev: synchronize 로 테이블 생성됨 / prod: 마이그레이션 후 첫 부팅).
  async onModuleInit(): Promise<void> {
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(SEED.map((s) => this.repo.create(s)));
      this.logger.log(`module_configs 시드 ${SEED.length}건 생성`);
    }
  }

  private toDto(e: ModuleConfig): ModuleConfigDto {
    return {
      id: e.id,
      axis: e.axis,
      moduleKey: e.module_key,
      label: e.label,
      order: e.sort_order,
      display: e.display,
      unit: e.unit,
    };
  }

  async list(): Promise<ModuleConfigDto[]> {
    const rows = await this.repo.find({ order: { axis: 'ASC', sort_order: 'ASC' } });
    return rows.map((r) => this.toDto(r));
  }

  async update(
    id: string,
    patch: Partial<Pick<ModuleConfigDto, 'label' | 'order' | 'display' | 'unit'>>,
  ): Promise<ModuleConfigDto> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('모듈 설정을 찾을 수 없습니다');
    if (patch.label !== undefined) entity.label = patch.label;
    if (patch.order !== undefined) entity.sort_order = patch.order;
    if (patch.display !== undefined) entity.display = patch.display;
    if (patch.unit !== undefined) entity.unit = patch.unit;
    const saved = await this.repo.save(entity);
    return this.toDto(saved);
  }

  // 분석 응답에 설정 없는 module_key 가 오면 자동 생성 (숨김). 비치명적.
  async ensureModules(
    axis: 'WNC' | 'SNH',
    items: { key: string; name?: string }[],
  ): Promise<void> {
    if (!items.length) return;
    try {
      const existing = await this.repo.find({ where: { axis } });
      const known = new Set(existing.map((e) => e.module_key));
      const missing = items.filter((i) => i.key && !known.has(i.key));
      if (!missing.length) return;
      await this.repo.save(
        missing.map((m) =>
          this.repo.create({
            axis,
            module_key: m.key,
            label: m.name || `${axis}_${m.key}`,
            sort_order: 999,
            display: false, // 자동 생성은 숨김 → admin 에서 켬
            unit: null,
          }),
        ),
      );
      this.logger.log(`module_configs 자동생성 ${axis}: ${missing.map((m) => m.key).join(',')}`);
    } catch (err) {
      this.logger.warn(`ensureModules 실패 (비치명적): ${String(err)}`);
    }
  }
}
