import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ImageDetectionResult } from './face-analysis.entity';
import { StorageModule } from '../storage/storage.module';
import { FaceAnalysisService } from './face-analysis.service';
import { FaceAnalysisController } from './face-analysis.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { ModuleConfigsModule } from '../module-configs/module-configs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImageDetectionResult]),
    StorageModule,
    ModuleConfigsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'fit-hair-secret-key'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [FaceAnalysisController],
  providers: [FaceAnalysisService, JwtAuthGuard, AdminGuard],
})
export class FaceAnalysisModule {}
