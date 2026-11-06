'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminHeader from '@/components/AdminHeader';
import { getTreatmentPhotos } from '@/utils/api';
import { getAdminToken } from '@/utils/auth';
import type { TreatmentPhotoPage, TreatmentPhotoSlot } from '@/utils/api';

function Photo({ label, url }: { label: string; url: string | null }) {
  return (
    <figure>
      <figcaption className="text-xs text-[#888888] mb-1">{label}</figcaption>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={label} className="w-full aspect-[3/4] object-cover border border-[#E5E5E5]" />
        </a>
      ) : (
        <div className="w-full aspect-[3/4] border border-[#E5E5E5] flex items-center justify-center text-xs text-[#BBBBBB]">
          없음
        </div>
      )}
    </figure>
  );
}

function Slot({ title, slot }: { title: string; slot: TreatmentPhotoSlot }) {
  return (
    <section>
      <h3 className="text-xs font-medium text-[#111111] mb-2">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        <Photo label="고객용 사진" url={slot.shown} />
        <Photo label="원본" url={slot.original} />
      </div>
    </section>
  );
}

export default function TreatmentPhotosPage() {
  const router = useRouter();
  const [data, setData] = useState<TreatmentPhotoPage | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push('/login');
      return;
    }
    let cancelled = false;
    setLoading(true);
    getTreatmentPhotos(token, page)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => toast.error('시술 사진을 불러오지 못했습니다.'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, router]);

  const lastPage = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;

  return (
    <div className="min-h-screen bg-white">
      <AdminHeader currentPath="/treatment-photos" />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-sm font-medium text-[#111111] tracking-wide">시술 사진</h1>
          <span className="text-xs text-[#888888]">총 {data?.total ?? 0}건</span>
        </div>

        {loading && !data ? (
          <p className="text-sm text-[#888888]">불러오는 중...</p>
        ) : data?.items.length ? (
          <div className="space-y-8">
            {data.items.map((item) => (
              <article key={item.id} className="border-t border-[#E5E5E5] pt-4">
                <p className="text-sm text-[#111111] mb-3">
                  {item.customerName || '이름 없음'}
                  <span className="text-xs text-[#888888] ml-2">
                    {[item.storeName, item.designerName, item.visitDate].filter(Boolean).join(' · ')}
                  </span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Slot title="BEFORE" slot={item.before} />
                  <Slot title="AFTER" slot={item.after} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#888888]">저장된 시술 사진이 없습니다.</p>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10 text-sm">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="disabled:text-[#BBBBBB]">
              이전
            </button>
            <span className="text-xs text-[#888888]">{page} / {lastPage}</span>
            <button disabled={page >= lastPage} onClick={() => setPage(page + 1)} className="disabled:text-[#BBBBBB]">
              다음
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
