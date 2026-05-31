import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ImageDetectionResult } from './face-analysis.entity';
import { PythonAnalysisService } from './python-analysis.service';
import { FaceAnalysisService } from './face-analysis.service';
import { FaceAnalysisController } from './face-analysis.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImageDetectionResult]),
    HttpModule,
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
  providers: [FaceAnalysisService, PythonAnalysisService, JwtAuthGuard, AdminGuard],
  exports: [PythonAnalysisService],
})
export class FaceAnalysisModule {}
