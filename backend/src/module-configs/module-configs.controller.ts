import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ModuleConfigsService, ModuleConfigDto } from './module-configs.service';
import { AdminGuard } from '../admin/admin.guard';

@ApiTags('module-configs')
@Controller()
export class ModuleConfigsController {
  constructor(private readonly service: ModuleConfigsService) {}

  @Get('module-configs')
  @ApiOperation({ summary: '얼굴분석 모듈 표시 설정 조회 (공개)' })
  async list() {
    const data = await this.service.list();
    return { data };
  }

  @Patch('admin/module-configs/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '모듈 표시 설정 수정 (어드민)' })
  async update(
    @Param('id') id: string,
    @Body() patch: Partial<Pick<ModuleConfigDto, 'label' | 'order' | 'display' | 'unit'>>,
  ) {
    const data = await this.service.update(id, patch);
    return { data };
  }
}
