import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminGuard } from '../admin/admin.guard';
import { FaceLandmarkTruthService } from './face-landmark-truth.service';

/** [admin · 로컬 전용] 랜드마크 정답 입력 — 사진 폴더 + 사진별 정답 JSON */
@ApiTags('face-analysis')
@Controller('face-analysis/admin/landmark-truth')
@ApiBearerAuth()
@UseGuards(AdminGuard)
export class FaceLandmarkTruthController {
  constructor(private readonly service: FaceLandmarkTruthService) {}

  @Get()
  @ApiOperation({ summary: '[admin] 정답 입력 대상 사진 목록' })
  list() {
    return { data: this.service.list() };
  }

  @Get('one')
  @ApiOperation({ summary: '[admin] 사진 한 장의 정답 (없으면 null)' })
  one(@Query('name') name: string) {
    return { data: this.service.get(name) };
  }

  @Get('photo')
  @ApiOperation({ summary: '[admin] 사진 원본' })
  photo(@Query('name') name: string, @Res() res: Response) {
    const { body, contentType } = this.service.openPhoto(name);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=600');
    body.pipe(res);
  }

  @Get('example')
  @ApiOperation({ summary: '[admin] 예시 그림 (기준시각화 PDF 페이지)' })
  example(@Query('name') name: string, @Res() res: Response) {
    const { body, contentType } = this.service.openExample(name);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    body.pipe(res);
  }

  @Post()
  @ApiOperation({ summary: '[admin] 정답 저장 (덮어쓰기)' })
  save(@Body() body: { name?: string; imageWidth?: unknown; imageHeight?: unknown; points?: unknown }) {
    return { data: this.service.save(body) };
  }
}
