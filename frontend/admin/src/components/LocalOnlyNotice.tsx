import Link from 'next/link';

/** 로컬 전용 화면을 배포 빌드에서 열었을 때 (owner: 관리자 본인 계정 전용 화면) */
export default function LocalOnlyNotice({ owner = false }: { owner?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 text-sm text-gray-500">
      <p>{owner ? '이 화면은 관리자 본인 계정에서만 열립니다.' : '이 화면은 로컬 개발 환경에서만 열립니다.'}</p>
      <Link href="/dashboard" className="text-gray-900 underline">
        대시보드로
      </Link>
    </div>
  );
}
