import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreSurvey } from './pre-surveys.entity';
import { Customer } from '../customers/customers.entity';
import { PreSurveysService } from './pre-surveys.service';
import { PreSurveysController } from './pre-surveys.controller';
import { FaceAnalysisModule } from '../face-analysis/face-analysis.module';

@Module({
  imports: [TypeOrmModule.forFeature([PreSurvey, Customer]), FaceAnalysisModule],
  controllers: [PreSurveysController],
  providers: [PreSurveysService],
  exports: [PreSurveysService],
})
export class PreSurveysModule {}
