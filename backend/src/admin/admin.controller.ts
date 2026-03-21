import { Controller, Post, Get, Patch, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body('email') email: string, @Body('password') password: string) {
    const result = await this.adminService.login(email, password);
    return { data: result };
  }

  @Get('users')
  @UseGuards(AdminGuard)
  async getUsers() {
    const users = await this.adminService.getUsers();
    return { data: users };
  }

  @Patch('users/:id/approve')
  @UseGuards(AdminGuard)
  async approveUser(@Param('id') id: string) {
    return this.adminService.updateStatus(id, 'approved');
  }

  @Patch('users/:id/reject')
  @UseGuards(AdminGuard)
  async rejectUser(@Param('id') id: string) {
    return this.adminService.updateStatus(id, 'rejected');
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  async getStats() {
    const stats = await this.adminService.getStats();
    return { data: stats };
  }
}
