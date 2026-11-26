// 로컬 개발(next dev)에서만 쓰는 화면 — 랜드마크 검수 · 랜드마크 정답.
// 배포 빌드(next build → Amplify)는 NODE_ENV=production 이라 메뉴가 빠지고 페이지도 열리지 않는다.
// 빌드 때 값이 박히는 상수라 서버 · 브라우저 렌더 결과가 같다.
export const IS_LOCAL_DEV = process.env.NODE_ENV !== 'production';

export const LOCAL_ONLY_PATHS = ['/landmark-review', '/landmark-truth'];
