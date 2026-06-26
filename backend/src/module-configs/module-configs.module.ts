import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ModuleConfig } from './module-config.entity';
import { ModuleConfigsService } from './module-configs.service';
import { ModuleConfigsController } from './module-configs.controller';
import { AdminAccount } from '../admin/admin-account.entity';
import { AdminGuard } from '../admin/admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModuleConfig, AdminAccount]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'fit-hair-secret-key'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [ModuleConfigsController],
  providers: [ModuleConfigsService, AdminGuard],
  exports: [ModuleConfigsService],
})
export class ModuleConfigsModule {}
