import { BadRequestException, Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminGuard } from '../admin/admin.guard';
import { FaceLandmarkReviewService, ReviewFilter, ReviewSource } from './face-landmark-review.service';

const FILTERS: ReviewFilter[] = ['all', 'unchecked', 'ok', 'bad'];
const SOURCES: ReviewSource[] = ['consultation', 'admin_test', 'all'];

/**
 * [admin] 랜드마크 검수. 경로를 face-analysis/admin/landmark-review 로 둔다.
 * 삭제는 DELETE 대신 POST …/clear — face-analysis.controller 의 DELETE admin/:id 와 겹치지 않게.
 */
@ApiTags('face-analysis')
@Controller('face-analysis/admin/landmark-review')
@ApiBearerAuth()
@UseGuards(AdminGuard)
export class FaceLandmarkReviewController {
  constructor(private readonly service: FaceLandmarkReviewService) {}

  @Get()
  @ApiOperation({ summary: '[admin] 랜드마크 검수 대상 사진 목록 (최신순) + 집계' })
  async list(
    @Query('filter') filter = 'unchecked',
    @Query('source') source = 'consultation',
    @Query('limit') limit = '24',
    @Query('offset') offset = '0',
  ) {
    if (!FILTERS.includes(filter as ReviewFilter)) throw new BadRequestException('filter 값이 잘못되었습니다');
    if (!SOURCES.includes(source as ReviewSource)) throw new BadRequestException('source 값이 잘못되었습니다');
    const data = await this.service.list({
      filter: filter as ReviewFilter,
      source: source as ReviewSource,
      limit: Math.min(Math.max(parseInt(limit, 10) || 24, 1), 60),
      offset: Math.max(parseInt(offset, 10) || 0, 0),
    });
    return { data };
  }

  // PUT 이 아니라 POST — main.ts CORS 허용 메서드에 PUT 이 없다
  @Post()
  @ApiOperation({ summary: '[admin] 사진 한 장 가/부 저장 (덮어쓰기)' })
  async save(@Body() body: { faceImageUrl?: string; verdict?: string; badParts?: unknown; note?: unknown }) {
    return { data: await this.service.save(body) };
  }

  @Get('photo')
  @ApiOperation({ summary: '[admin] 검수 대상 사진 원본 (서버가 S3 에서 받아 그대로 넘김)' })
  async photo(@Query('url') url: string, @Res() res: Response) {
    const { body, contentType } = await this.service.openPhoto(url);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=600');
    body.pipe(res);
  }

  @Post('clear')
  @ApiOperation({ summary: '[admin] 검수 취소 (미검수로)' })
  async clear(@Body() body: { faceImageUrl?: string }) {
    return { data: await this.service.clear(body.faceImageUrl ?? '') };
  }
}
