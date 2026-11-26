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
import { FaceLandmarkReview } from './face-landmark-review.entity';
import { FaceLandmarkReviewService } from './face-landmark-review.service';
import { FaceLandmarkReviewController } from './face-landmark-review.controller';
import { FaceLandmarkTruthService } from './face-landmark-truth.service';
import { FaceLandmarkTruthController } from './face-landmark-truth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImageDetectionResult, FaceLandmarkReview]),
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
  controllers: [FaceAnalysisController, FaceLandmarkReviewController, FaceLandmarkTruthController],
  providers: [FaceAnalysisService, FaceLandmarkReviewService, FaceLandmarkTruthService, JwtAuthGuard, AdminGuard],
})
export class FaceAnalysisModule {}
