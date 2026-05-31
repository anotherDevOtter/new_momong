import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PreSurveysService } from './pre-surveys.service';

@ApiTags('pre-surveys')
@Controller('pre-surveys')
export class PreSurveysController {
  constructor(private readonly service: PreSurveysService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '사전설문지 토큰 발급' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body('customerId') customerId: string) {
    const survey = await this.service.create(req.user.id, customerId);
    return { success: true, data: survey };
  }

  @Get('by-customer/:customerId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '고객별 사전설문지 목록' })
  async listByCustomer(@Request() req, @Param('customerId') customerId: string) {
    const surveys = await this.service.findByCustomer(req.user.id, customerId);
    return { success: true, data: surveys };
  }

  @Get('token/:token')
  @ApiOperation({ summary: '공개: 토큰으로 사전설문지 조회 (고객 작성용)' })
  async fetchByToken(@Param('token') token: string) {
    const { survey, customer } = await this.service.findByToken(token);
    return {
      success: true,
      data: {
        token: survey.token,
        answers: survey.answers,
        filled_at: survey.filled_at,
        customer: { name: customer.name },
      },
    };
  }

  @Patch('token/:token')
  @ApiOperation({ summary: '공개: 사전설문지 답변 저장' })
  async saveAnswers(
    @Param('token') token: string,
    @Body() body: { answers: Record<string, unknown>; submit?: boolean },
  ) {
    const survey = await this.service.saveAnswers(token, body.answers ?? {}, !!body.submit);
    return { success: true, data: { filled_at: survey.filled_at } };
  }

  @Post('token/:token/upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '공개: 사전설문 첨부 이미지 업로드용 presigned URL 발급' })
  async createUploadUrl(
    @Param('token') token: string,
    @Body() body: { contentType: string; ext?: string; contentLength?: number },
  ) {
    const data = await this.service.createUploadUrl(token, body);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async remove(@Request() req, @Param('id') id: string) {
    await this.service.remove(req.user.id, id);
    return { success: true };
  }
}
