import { BadRequestException, Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { FaceAnalysisService } from './face-analysis.service';

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

@ApiTags('face-analysis')
@Controller('face-analysis')
@ApiBearerAuth()
export class FaceAnalysisController {
  constructor(private readonly service: FaceAnalysisService) {}

  @Post('upload-url')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'S3 업로드용 presigned URL 발급 (일반 사용자)' })
  async createUploadUrl(
    @Body() body: { contentType: string; ext?: string; contentLength?: number },
    @Req() req: Request,
  ) {
    validateUploadBody(body);
    const userId = (req.user as { sub?: string } | undefined)?.sub;
    const data = await this.service.createUploadUrl({
      userId,
      contentType: body.contentType,
      ext: body.ext,
    });
    return { data };
  }

  @Post('admin/upload-url')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[admin] S3 업로드용 presigned URL 발급' })
  async createAdminUploadUrl(
    @Body() body: { contentType: string; ext?: string; contentLength?: number },
    @Req() req: Request,
  ) {
    validateUploadBody(body);
    const adminId = (req.user as { sub?: string } | undefined)?.sub;
    const data = await this.service.createUploadUrl({
      userId: adminId,
      contentType: body.contentType,
      ext: body.ext,
    });
    return { data };
  }

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '얼굴 이미지 분석 (실제 컨설팅)' })
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
      source: 'consultation',
    });
    return { data };
  }

  @Post('analyze-test')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[admin] 얼굴 이미지 분석 테스트 (source=admin_test)' })
  async analyzeTest(
    @Body()
    body: {
      faceImageUrl: string;
      imageId?: string;
    },
    @Req() req: Request,
  ) {
    const adminId = (req.user as { sub?: string } | undefined)?.sub;
    const data = await this.service.analyze({
      userId: adminId || null,
      customerId: null,
      faceImageUrl: body.faceImageUrl,
      imageId: body.imageId,
      clientProvidedData: null,
      source: 'admin_test',
    });
    return { data };
  }
}

function validateUploadBody(body: { contentType: string; contentLength?: number }) {
  if (!body.contentType?.startsWith('image/')) {
    throw new BadRequestException('이미지 파일만 업로드할 수 있습니다');
  }
  if (body.contentLength != null && body.contentLength > MAX_UPLOAD_BYTES) {
    throw new BadRequestException(
      `이미지 크기가 너무 큽니다 (최대 ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB)`,
    );
  }
}
