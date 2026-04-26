export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    public serverMessage: string,
    public path?: string,
  ) {
    super(serverMessage);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  url: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (init.token) headers.set('Authorization', `Bearer ${init.token}`);

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (err) {
    console.error('[API] network error', init.method ?? 'GET', url, err);
    throw new ApiError(0, 'NETWORK_ERROR', '네트워크 연결을 확인해주세요');
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('[API]', init.method ?? 'GET', url, {
      status: res.status,
      body: json,
    });
    throw new ApiError(
      res.status,
      json?.code,
      json?.message ?? '요청 실패',
      json?.path,
    );
  }
  return json as T;
}

export function describeApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.serverMessage;
    if (err.status === 401) return '로그인이 만료되었습니다. 다시 로그인해주세요.';
    if (err.status === 403) return '권한이 없습니다.';
    if (err.status === 404) return err.serverMessage || '데이터를 찾을 수 없습니다.';
    if (err.status === 400) return `입력 오류: ${err.serverMessage}`;
    if (err.status >= 500) return `서버 오류 (${err.status}): ${err.serverMessage}`;
    return `요청 실패 (${err.status}): ${err.serverMessage}`;
  }
  return '알 수 없는 오류가 발생했습니다.';
}
