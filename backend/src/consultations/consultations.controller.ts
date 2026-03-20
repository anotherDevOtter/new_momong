import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';

@ApiTags('consultations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post()
  @ApiOperation({ summary: '컨설팅 저장' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() dto: CreateConsultationDto) {
    const result = await this.consultationsService.create(req.user.id, dto);
    return { success: true, data: result };
  }

  @Get()
  @ApiOperation({ summary: '내 컨설팅 목록 조회' })
  async findAll(@Request() req) {
    const consultations = await this.consultationsService.findAll(req.user.id);
    return { success: true, data: { consultations } };
  }

  // ⚠️ by-customer 라우트는 :id 보다 먼저 정의
  @Get('by-customer/:phone')
  @ApiOperation({ summary: '전화번호로 고객 컨설팅 이력 조회' })
  async findByCustomerPhone(@Request() req, @Param('phone') phone: string) {
    const consultations = await this.consultationsService.findByCustomerPhone(
      req.user.id,
      decodeURIComponent(phone),
    );
    return { success: true, data: { consultations } };
  }

  @Get('by-customer-id/:customerId')
  @ApiOperation({ summary: '고객 UUID로 컨설팅 이력 조회' })
  async findByCustomerId(@Request() req, @Param('customerId') customerId: string) {
    const consultations = await this.consultationsService.findByCustomerId(
      req.user.id,
      customerId,
    );
    return { success: true, data: { consultations } };
  }

  @Get(':id')
  @ApiOperation({ summary: '단일 컨설팅 조회' })
  async findOne(@Request() req, @Param('id') id: string) {
    const consultation = await this.consultationsService.findOne(req.user.id, id);
    return { success: true, data: { consultation } };
  }

  @Delete(':id')
  @ApiOperation({ summary: '컨설팅 삭제' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.consultationsService.remove(req.user.id, id);
    return { success: true, data: { deleted: true } };
  }
}
