import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController (헬스 체크)', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('status: ok 와 uptime/timestamp 를 반환한다', () => {
    const health = appController.getHealth();
    expect(health.status).toBe('ok');
    expect(typeof health.uptime).toBe('number');
    expect(Number.isNaN(Date.parse(health.timestamp))).toBe(false);
  });
});
