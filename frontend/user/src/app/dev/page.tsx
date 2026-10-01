import { notFound } from 'next/navigation';
import { DevEntry } from './DevEntry';

/** 개발 전용 진입 페이지 — 운영 빌드에서는 404 */
export default function DevPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <DevEntry />;
}
