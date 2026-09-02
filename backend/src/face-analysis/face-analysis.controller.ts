import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { FaceAnalysisService } from './face-analysis.service';
import { PythonAnalysisService } from './python-analysis.service';

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

@ApiTags('face-analysis')
@Controller('face-analysis')
@ApiBearerAuth()
export class FaceAnalysisController {
  constructor(
    private readonly service: FaceAnalysisService,
    private readonly python: PythonAnalysisService,
  ) {}

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
  ) {
    validateUploadBody(body);
    // admin 의 sub 는 admin_accounts.id 라서 users 테이블에 없음 → S3 key 도 별도 prefix 로
    const data = await this.service.createUploadUrl({
      userId: 'admin',
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
    // 버킷이 비공개라 업로드에 쓴 publicUrl 로는 이미지를 못 읽는다.
    // 프론트가 촬영본을 화면에 표시할 수 있도록 GET presigned URL 을 함께 준다
    // (admin 의 analyze-test 는 이미 같은 값을 반환하고 있었다).
    const faceImageDownloadUrl = await this.python.createDownloadPresignedUrl(body.faceImageUrl);
    return { data: { ...data, faceImageDownloadUrl } };
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
  ) {
    // admin 의 sub 는 admin_accounts.id 라서 users FK 위반 → user_id 는 null 로 저장
    // source='admin_test' 로 구분되므로 admin 호출임을 추적 가능
    const data = await this.service.analyze({
      userId: null,
      customerId: null,
      faceImageUrl: body.faceImageUrl,
      imageId: body.imageId,
      clientProvidedData: null,
      source: 'admin_test',
    });
    // 프론트가 원본 이미지를 표시할 수 있도록 GET presigned URL 도 함께 반환
    const faceImageDownloadUrl = await this.python.createDownloadPresignedUrl(body.faceImageUrl);
    return { data: { ...data, faceImageDownloadUrl } };
  }

  @Get('admin/history')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[admin] 분석 테스트 기록 목록 (최신순)' })
  async listHistory(@Query('limit') limit?: string) {
    const records = await this.service.listBySource('admin_test', {
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return { data: records };
  }

  @Get('admin/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[admin] 분석 기록 단건 조회' })
  async getRecord(@Param('id') id: string) {
    const record = await this.service.getRecordById(id);
    return { data: record };
  }

  @Delete('admin/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[admin] 분석 기록 삭제 (WNC+SNH 짝까지)' })
  async deleteRecord(@Param('id') id: string) {
    const result = await this.service.deleteRecordById(id);
    return { data: result };
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
