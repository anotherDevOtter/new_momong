import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './consultations.entity';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { CustomersModule } from '../customers/customers.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Consultation]), CustomersModule, StorageModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
})
export class ConsultationsModule {}
