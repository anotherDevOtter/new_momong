'use client';

/**
 * 개발 전용 목업을 불러오는 자리. 화면에는 아무 것도 그리지 않는다.
 * 모듈을 가져오는 것만으로 fetch 가로채기가 걸리므로, AuthProvider 보다 먼저 두어
 * 로그인 확인(/auth/me) 요청부터 목업이 받게 한다. (NODE_ENV 가 development 일 때만 동작)
 */
import '@/lib/devMock';

export function DevMock() {
  return null;
}
