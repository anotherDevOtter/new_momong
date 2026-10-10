import { Controller, Post, Get, Patch, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '어드민 로그인' })
  @ApiBody({ schema: { properties: { email: { type: 'string' }, password: { type: 'string' } } } })
  async login(@Body('email') email: string, @Body('password') password: string) {
    const result = await this.adminService.login(email, password);
    return { data: result };
  }

  @Get('users')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '전체 유저 목록 조회 (어드민)' })
  async getUsers() {
    const users = await this.adminService.getUsers();
    return { data: users };
  }

  @Patch('users/:id/approve')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '유저 승인' })
  async approveUser(@Param('id') id: string) {
    return this.adminService.updateStatus(id, 'approved');
  }

  @Patch('users/:id/reject')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '유저 거절' })
  async rejectUser(@Param('id') id: string) {
    return this.adminService.updateStatus(id, 'rejected');
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '통계 조회 (어드민)' })
  async getStats() {
    const stats = await this.adminService.getStats();
    return { data: stats };
  }
}
