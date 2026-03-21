import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SharesService } from './shares.service';

@ApiTags('shares')
@Controller('shares')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  // 인증 필요: 링크 생성
  @Post(':consultationId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createShare(
    @Param('consultationId') consultationId: string,
    @Body('password') password: string,
    @Request() req,
  ) {
    const result = await this.sharesService.createShare(
      consultationId,
      password,
      req.user.id,
    );
    return { data: result };
  }

  // 인증 필요: 공유 링크 조회 (링크 + 비밀번호)
  @Get('by-consultation/:consultationId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getShare(
    @Param('consultationId') consultationId: string,
    @Request() req: { user: { id: string } },
  ) {
    const result = await this.sharesService.getShareByConsultation(consultationId, req.user.id);
    return { data: result };
  }

  // 공개: 비밀번호로 결과 조회
  @Post(':token/verify')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Param('token') token: string,
    @Body('password') password: string,
  ) {
    const consultation = await this.sharesService.verifyAndGetConsultation(
      token,
      password,
    );
    return { data: consultation };
  }
}
