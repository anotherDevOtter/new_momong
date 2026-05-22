import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
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
    @Body() body: { contentType: string; ext?: string },
    @Req() req: Request,
  ) {
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
