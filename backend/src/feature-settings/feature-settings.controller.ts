import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeatureSettingsService, FeatureSettingsDto } from './feature-settings.service';
import { AdminGuard } from '../admin/admin.guard';

@ApiTags('feature-settings')
@Controller()
export class FeatureSettingsController {
  constructor(private readonly service: FeatureSettingsService) {}

  @Get('feature-settings')
  @ApiOperation({ summary: '기능 플래그 조회 (공개)' })
  async get() {
    const data = await this.service.get();
    return { data };
  }

  @Patch('admin/feature-settings')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '기능 플래그 수정 (어드민)' })
  async update(@Body() patch: Partial<FeatureSettingsDto>) {
    const data = await this.service.update(patch);
    return { data };
  }
}
