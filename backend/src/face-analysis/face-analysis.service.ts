import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ImageDetectionResult, AnalysisSource } from './face-analysis.entity';
import { PythonAnalysisService, PythonAnalysisResponse } from './python-analysis.service';

@Injectable()
export class FaceAnalysisService {
  private readonly logger = new Logger(FaceAnalysisService.name);

  constructor(
    @InjectRepository(ImageDetectionResult)
    private readonly resultsRepo: Repository<ImageDetectionResult>,
    private readonly python: PythonAnalysisService,
  ) {}

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
