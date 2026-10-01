/**
 * 개발 전용 — 백엔드·로그인 없이 화면을 볼 때 쓰는 목업.
 *
 * `/dev` 에서 '목업으로 시작' 을 누르면 localStorage 에 플래그와 가짜 로그인 정보가 들어가고,
 * 이 모듈이 API 요청(NEXT_PUBLIC_API_URL 로 가는 fetch)만 가로채 가짜 응답을 돌려준다.
 * 다른 주소로 가는 요청(이미지·CDN·모델 파일 등)은 그대로 통과한다.
 *
 * - NODE_ENV 가 'development' 가 아니면 아무 것도 하지 않는다 (운영 빌드에서는 무시).
 * - 응답은 화면이 뜰 만큼만의 최소 모양이다. 저장·조회 결과는 실제로 남지 않는다.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200/api';

export const DEV_MOCK_KEY = 'dev_mock';
export const DEV_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';

const DEV_USER = { id: 'dev-user', email: 'dev@local.dev', storeName: '개발 매장', ownerName: '개발 디자이너' };
const DEV_CUSTOMER = {
  id: DEV_CUSTOMER_ID,
  name: '홍길동',
  phone: '01012345678',
  gender: 'female',
  age_group: '20대',
  memo: '',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const isDev = process.env.NODE_ENV === 'development';

export function isDevMockOn(): boolean {
  if (!isDev || typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(DEV_MOCK_KEY) === '1';
  } catch {
    return false;
  }
}

/** 가짜 로그인 정보를 넣고 목업을 켠다. 다음 페이지 로드부터 적용된다 */
export function enableDevMock() {
  if (!isDev) return;
  window.localStorage.setItem(DEV_MOCK_KEY, '1');
  window.localStorage.setItem('auth_token', 'dev-mock-token');
  window.localStorage.setItem('auth_user', JSON.stringify(DEV_USER));
}

/** 목업을 끄고 가짜 로그인 정보를 지운다 */
export function disableDevMock() {
  window.localStorage.removeItem(DEV_MOCK_KEY);
  window.localStorage.removeItem('auth_token');
  window.localStorage.removeItem('auth_user');
}

function json(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockResponse(path: string, method: string): Response {
  if (path === '/auth/me') return json(DEV_USER);
  if (path === '/auth/login') return json({ token: 'dev-mock-token', user: DEV_USER });
  if (method !== 'GET') return json({ id: 'dev-mock-id' });                 // 저장·수정·삭제는 성공만 알린다
  if (path === '/customers') return json({ customers: [DEV_CUSTOMER] });
  const customer = path.match(/^\/customers\/([^/]+)$/);
  if (customer) return json({ ...DEV_CUSTOMER, id: customer[1] });
  return json([]);                                                          // 그 밖의 조회는 빈 목록
}

if (isDev && typeof window !== 'undefined' && isDevMockOn() && !(window as unknown as { __devMock?: boolean }).__devMock) {
  (window as unknown as { __devMock?: boolean }).__devMock = true;
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith(API_BASE)) return realFetch(input, init);
    const path = url.slice(API_BASE.length).split('?')[0];
    const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
    return mockResponse(path, method);
  };
}
