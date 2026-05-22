import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { FeatureSettings } from './feature-settings.entity';
import { FeatureSettingsService } from './feature-settings.service';
import { FeatureSettingsController } from './feature-settings.controller';
import { AdminAccount } from '../admin/admin-account.entity';
import { AdminGuard } from '../admin/admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeatureSettings, AdminAccount]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'fit-hair-secret-key'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [FeatureSettingsController],
  providers: [FeatureSettingsService, AdminGuard],
})
export class FeatureSettingsModule {}
