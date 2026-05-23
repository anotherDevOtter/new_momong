import { BadRequestException, Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FaceAnalysisService } from './face-analysis.service';

@ApiTags('face-analysis')
@Controller('face-analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FaceAnalysisController {
  constructor(private readonly service: FaceAnalysisService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'S3 업로드용 presigned URL 발급' })
  async createUploadUrl(
    @Body() body: { contentType: string; ext?: string; contentLength?: number },
    @Req() req: Request,
  ) {
    if (!body.contentType?.startsWith('image/')) {
      throw new BadRequestException('이미지 파일만 업로드할 수 있습니다');
    }
    // 프론트가 리사이즈하지만 방어선: 3MB 초과 거절. 프론트가 contentLength 미전달 시 통과 (S3 비용 limit 은 lifecycle 정책에서 별도 관리)
    const MAX_BYTES = 3 * 1024 * 1024;
    if (body.contentLength != null && body.contentLength > MAX_BYTES) {
      throw new BadRequestException(`이미지 크기가 너무 큽니다 (최대 ${MAX_BYTES / (1024 * 1024)}MB)`);
    }
    const userId = (req.user as { sub?: string } | undefined)?.sub;
    const data = await this.service.createUploadUrl({
      userId,
      contentType: body.contentType,
      ext: body.ext,
    });
    return { data };
  }

  @Post('analyze')
  @ApiOperation({ summary: '얼굴 이미지 분석 (Python 서버 호출 + 결과 저장)' })
  async analyze(
    @Body()
    body: {
      faceImageUrl: string;
      customerId?: string;
      imageId?: string;
      clientProvidedData?: Record<string, unknown>;
    },
    @Req() req: Request,
  ) {
    const userId = (req.user as { sub?: string } | undefined)?.sub;
    const data = await this.service.analyze({
      userId: userId || null,
      customerId: body.customerId || null,
      faceImageUrl: body.faceImageUrl,
      imageId: body.imageId,
      clientProvidedData: body.clientProvidedData || null,
    });
    return { data };
  }
}
