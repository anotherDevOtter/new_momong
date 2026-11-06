import { applyDecorators, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

const MINUTE = 60_000;

/** IP 하나가 `minutes` 분 안에 보낼 수 있는 요청 수를 제한한다 */
export const RateLimit = (limit: number, minutes: number) =>
  applyDecorators(UseGuards(ThrottlerGuard), Throttle({ default: { limit, ttl: minutes * MINUTE } }));
