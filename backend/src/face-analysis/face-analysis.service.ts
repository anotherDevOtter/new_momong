import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ImageDetectionResult, AnalysisSource } from './face-analysis.entity';
import { PythonAnalysisService, PythonAnalysisResponse } from './python-analysis.service';
import { ModuleConfigsService } from '../module-configs/module-configs.service';

export interface AdminTestRecord {
  id: string;
  faceImageUrl: string;
  faceImageDownloadUrl: string;
  detectedAt: Date;
  wnc: { id: string; result: Record<string, unknown> };
  snh: { id: string; result: Record<string, unknown> };
}

@Injectable()
export class FaceAnalysisService {
  private readonly logger = new Logger(FaceAnalysisService.name);

  constructor(
    @InjectRepository(ImageDetectionResult)
    private readonly resultsRepo: Repository<ImageDetectionResult>,
    private readonly python: PythonAnalysisService,
    private readonly moduleConfigs: ModuleConfigsService,
  ) {}

  // 응답 results({ key: { name } }) → { key, name }[] 추출 (자동생성용)
  private moduleItems(group: { results?: Record<string, { name?: string }> } | undefined) {
    return Object.entries(group?.results ?? {}).map(([key, m]) => ({ key, name: m?.name }));
  }

  /**
   * 클라이언트에서 S3 에 PUT 할 수 있는 presigned URL 발급.
   * key 는 `face-analysis/<userId>/<uuid>.<ext>` 패턴으로 생성.
   */
  async createUploadUrl(opts: { userId?: string; contentType: string; ext?: string }) {
    const ext = (opts.ext || this.extFromContentType(opts.contentType)).replace('.', '');
    const key = `face-analysis/${opts.userId || 'anonymous'}/${randomUUID()}.${ext}`;
    return this.python.createUploadPresignedUrl({ key, contentType: opts.contentType });
  }

  /**
   * Python 서버로 분석 호출 + WNC/SNH 결과를 각각 한 행씩 저장.
   */
  async analyze(opts: {
    userId?: string | null;
    customerId?: string | null;
    faceImageUrl: string;
    imageId?: string;
    clientProvidedData?: Record<string, unknown> | null;
    source?: AnalysisSource;
  }): Promise<{
    wnc: PythonAnalysisResponse['data']['wnc'];
    snh: PythonAnalysisResponse['data']['snh'];
    metadata: PythonAnalysisResponse['metadata'];
    wncId: string;
    snhId: string;
  }> {
    const imageId = opts.imageId || randomUUID();
    const response = await this.python.analyzeImage(opts.faceImageUrl, imageId);

    // 응답에 설정 없는 모듈이 오면 표시설정 자동 생성(숨김). 비치명적.
    await this.moduleConfigs.ensureModules('WNC', this.moduleItems(response.data.wnc));
    await this.moduleConfigs.ensureModules('SNH', this.moduleItems(response.data.snh));

    const baseRow = {
      user_id: opts.userId || null,
      customer_id: opts.customerId || null,
      face_image_url: opts.faceImageUrl,
      source: opts.source || 'consultation',
    };

    const [wncSaved, snhSaved] = await Promise.all([
      this.resultsRepo.save(
        this.resultsRepo.create({
          ...baseRow,
          detection_type: 'WNC',
          python_analysis_result: response.data.wnc as unknown as Record<string, unknown>,
          client_provided_data: opts.clientProvidedData || null,
        }),
      ),
      this.resultsRepo.save(
        this.resultsRepo.create({
          ...baseRow,
          detection_type: 'SNH',
          python_analysis_result: response.data.snh as unknown as Record<string, unknown>,
          client_provided_data: opts.clientProvidedData || null,
        }),
      ),
    ]);

    return {
      wnc: response.data.wnc,
      snh: response.data.snh,
      metadata: response.metadata,
      wncId: wncSaved.id,
      snhId: snhSaved.id,
    };
  }

  /**
   * source 별 분석 기록 목록. WNC + SNH 행을 face_image_url 기준으로 짝지어 반환.
   * 이미지 다운로드용 presigned URL 도 포함.
   */
  async listBySource(source: AnalysisSource, opts: { limit?: number } = {}): Promise<AdminTestRecord[]> {
    const limit = Math.min(opts.limit ?? 50, 100);
    // 짝수 행 가져오려면 *2
    const rows = await this.resultsRepo.find({
      where: { source },
      order: { detected_at: 'DESC' },
      take: limit * 2,
    });

    // face_image_url 로 그룹핑
    const groups = new Map<string, ImageDetectionResult[]>();
    for (const row of rows) {
      const arr = groups.get(row.face_image_url) || [];
      arr.push(row);
      groups.set(row.face_image_url, arr);
    }

    const records: AdminTestRecord[] = [];
    for (const [faceImageUrl, pair] of groups) {
      const wnc = pair.find((r) => r.detection_type === 'WNC');
      const snh = pair.find((r) => r.detection_type === 'SNH');
      if (!wnc || !snh) continue; // 불완전 쌍 스킵
      const downloadUrl = await this.python.createDownloadPresignedUrl(faceImageUrl);
      records.push({
        id: wnc.id, // 식별용 — WNC id 사용
        faceImageUrl,
        faceImageDownloadUrl: downloadUrl,
        detectedAt: wnc.detected_at,
        wnc: { id: wnc.id, result: wnc.python_analysis_result },
        snh: { id: snh.id, result: snh.python_analysis_result },
      });
      if (records.length >= limit) break;
    }
    return records;
  }

  /**
   * id (WNC 또는 SNH) 로 짝 조회. 이미지 다운로드 URL 포함.
   */
  async getRecordById(id: string): Promise<AdminTestRecord> {
    const row = await this.resultsRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('분석 기록을 찾을 수 없습니다');
    const pair = await this.resultsRepo.find({
      where: { face_image_url: row.face_image_url, source: row.source },
    });
    const wnc = pair.find((r) => r.detection_type === 'WNC');
    const snh = pair.find((r) => r.detection_type === 'SNH');
    if (!wnc || !snh) throw new NotFoundException('짝이 되는 분석 행을 찾을 수 없습니다');
    const downloadUrl = await this.python.createDownloadPresignedUrl(row.face_image_url);
    return {
      id: wnc.id,
      faceImageUrl: row.face_image_url,
      faceImageDownloadUrl: downloadUrl,
      detectedAt: wnc.detected_at,
      wnc: { id: wnc.id, result: wnc.python_analysis_result },
      snh: { id: snh.id, result: snh.python_analysis_result },
    };
  }

  /**
   * face_image_url 매칭으로 WNC+SNH 짝 모두 삭제. S3 객체는 lifecycle 정책으로 처리.
   */
  async deleteRecordById(id: string): Promise<{ deleted: number }> {
    const row = await this.resultsRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('분석 기록을 찾을 수 없습니다');
    const res = await this.resultsRepo.delete({
      face_image_url: row.face_image_url,
      source: row.source,
    });
    return { deleted: res.affected || 0 };
  }

  private extFromContentType(contentType: string): string {
    const map: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
    };
    return map[contentType] || 'jpg';
  }
}
