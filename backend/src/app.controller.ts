import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { AppService, HealthStatus } from './app.service';

// main.ts 의 setGlobalPrefix('api', { exclude: ['/'] }) 로 루트만 프리픽스에서 제외된다.
// 이 엔드포인트는 Elastic Beanstalk 헬스 체크가 때린다.
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiExcludeEndpoint()
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }
}
