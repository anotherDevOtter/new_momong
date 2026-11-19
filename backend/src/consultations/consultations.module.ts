import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './consultations.entity';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { CustomersModule } from '../customers/customers.module';
import { StorageModule } from '../storage/storage.module';
import { OsSyncModule } from '../os-sync/os-sync.module';

@Module({
  imports: [TypeOrmModule.forFeature([Consultation]), CustomersModule, StorageModule, OsSyncModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
})
export class ConsultationsModule {}
