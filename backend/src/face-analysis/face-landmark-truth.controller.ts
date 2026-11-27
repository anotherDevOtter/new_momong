import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AdminGuard } from '../admin/admin.guard';
import { AdminUser, FaceLandmarkTruthService } from './face-landmark-truth.service';

type AdminRequest = Request & { user?: AdminUser };

/** [admin] 랜드마크 정답 입력 — 운영은 관리자 본인 계정(ADMIN_EMAIL)만 */
@ApiTags('face-analysis')
@Controller('face-analysis/admin/landmark-truth')
@ApiBearerAuth()
@UseGuards(AdminGuard)
export class FaceLandmarkTruthController {
  constructor(private readonly service: FaceLandmarkTruthService) {}

  @Get()
  @ApiOperation({ summary: '[admin] 정답 입력 대상 사진 목록' })
  async list(@Req() req: AdminRequest) {
    return { data: await this.service.list(req.user) };
  }

  @Get('one')
  @ApiOperation({ summary: '[admin] 사진 한 장의 정답 (없으면 null)' })
  async one(@Req() req: AdminRequest, @Query('name') name: string) {
    return { data: await this.service.get(req.user, name) };
  }

  @Get('photo')
  @ApiOperation({ summary: '[admin] 사진 원본' })
  async photo(@Req() req: AdminRequest, @Query('name') name: string, @Res() res: Response) {
    const { body, contentType } = await this.service.openPhoto(req.user, name);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=600');
    body.pipe(res);
  }

  @Get('example')
  @ApiOperation({ summary: '[admin] 예시 그림 (기준시각화 PDF 페이지)' })
  example(@Req() req: AdminRequest, @Query('name') name: string, @Res() res: Response) {
    const { body, contentType } = this.service.openExample(req.user, name);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    body.pipe(res);
  }

  @Post()
  @ApiOperation({ summary: '[admin] 정답 저장 (덮어쓰기)' })
  async save(
    @Req() req: AdminRequest,
    @Body() body: { name?: string; imageWidth?: unknown; imageHeight?: unknown; points?: unknown },
  ) {
    return { data: await this.service.save(req.user, body) };
  }
}
