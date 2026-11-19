/**
 * 예전 상담 전체를 모몽 OS 로 한 번 보낸다 (일회성).
 *
 * 운영 서버(~/momong)에서:
 *   docker compose exec api node dist/scripts/os-backfill.js --dry   # 몇 건인지만
 *   docker compose exec api node dist/scripts/os-backfill.js         # 실제 전송
 * 실패한 건은 `backfill <id> failed` 로그에 남는다. 그대로 다시 돌리면 된다.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { OsSyncService } from '../os-sync/os-sync.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  try {
    const r = await app.get(OsSyncService).backfillAll({ dryRun: process.argv.includes('--dry') });
    console.log(JSON.stringify(r));
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
