import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreSurvey } from './pre-surveys.entity';
import { Customer } from '../customers/customers.entity';
import { PreSurveysService } from './pre-surveys.service';
import { PreSurveysController } from './pre-surveys.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([PreSurvey, Customer]), StorageModule],
  controllers: [PreSurveysController],
  providers: [PreSurveysService],
  exports: [PreSurveysService],
})
export class PreSurveysModule {}
