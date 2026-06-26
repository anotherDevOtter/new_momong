import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { SharesModule } from './shares/shares.module';
import { AdminModule } from './admin/admin.module';
import { FeatureSettingsModule } from './feature-settings/feature-settings.module';
import { FaceAnalysisModule } from './face-analysis/face-analysis.module';
import { PreSurveysModule } from './pre-surveys/pre-surveys.module';
import { ModuleConfigsModule } from './module-configs/module-configs.module';
import { User } from './auth/users.entity';
import { Customer } from './customers/customers.entity';
import { Consultation } from './consultations/consultations.entity';
import { ConsultationShare } from './shares/shares.entity';
import { AdminAccount } from './admin/admin-account.entity';
import { FeatureSettings } from './feature-settings/feature-settings.entity';
import { ImageDetectionResult } from './face-analysis/face-analysis.entity';
import { PreSurvey } from './pre-surveys/pre-surveys.entity';
import { ModuleConfig } from './module-configs/module-config.entity';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'password'),
        database: config.get('DB_DATABASE', 'fit_hair'),
        entities: [User, Customer, Consultation, ConsultationShare, AdminAccount, FeatureSettings, ImageDetectionResult, PreSurvey, ModuleConfig],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
        ssl: config.get('NODE_ENV') !== 'development' ? { rejectUnauthorized: false } : false,
        extra: {
          max: 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      }),
    }),
    AuthModule,
    CustomersModule,
    ConsultationsModule,
    SharesModule,
    AdminModule,
    FeatureSettingsModule,
    FaceAnalysisModule,
    PreSurveysModule,
    ModuleConfigsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
