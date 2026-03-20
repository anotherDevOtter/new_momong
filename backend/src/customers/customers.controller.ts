import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: '내 고객 목록 조회' })
  @ApiQuery({ name: 'q', required: false })
  async findAll(@Request() req, @Query('q') q?: string) {
    const customers = await this.customersService.findAll(req.user.id, q);
    return { success: true, data: { customers, total: customers.length } };
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 고객 조회' })
  async findOne(@Request() req, @Param('id') id: string) {
    const customer = await this.customersService.findOne(req.user.id, id);
    return { success: true, data: customer };
  }

  @Post()
  @ApiOperation({ summary: '고객 등록' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() dto: CreateCustomerDto) {
    const customer = await this.customersService.create(req.user.id, dto);
    return { success: true, data: customer };
  }

  @Patch(':id')
  @ApiOperation({ summary: '고객 정보 수정' })
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    const customer = await this.customersService.update(req.user.id, id, dto);
    return { success: true, data: customer };
  }

  @Delete(':id')
  @ApiOperation({ summary: '고객 삭제' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.customersService.remove(req.user.id, id);
    return { success: true, data: { deleted: true } };
  }
}
