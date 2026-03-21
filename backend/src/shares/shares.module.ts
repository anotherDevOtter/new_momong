import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationShare } from './shares.entity';
import { Consultation } from '../consultations/consultations.entity';
import { SharesService } from './shares.service';
import { SharesController } from './shares.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConsultationShare, Consultation])],
  controllers: [SharesController],
  providers: [SharesService],
})
export class SharesModule {}
