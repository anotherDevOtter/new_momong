'use client';

/**
 * 상담 이력 — 고객 목록 화면의 두 번째 탭.
 *
 * 시안 `CustomerHistory` 를 그대로 옮겼다 (제목·검색·필터·목록 구성과 여백까지).
 * 데이터는 이미 있는 API(getAllConsultations)를 쓴다 — 백엔드 추가는 없다.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { getAllConsultations } from '@/utils/api';
import type { ConsultationRecord } from '@/types';

const COURSE_FILTERS = ['전체', '1WAY', '2WAY', '3WAY'] as const;
type CourseFilter = (typeof COURSE_FILTERS)[number];

interface Props {
  token: string;
  /** 한 줄을 누르면 그 고객 상세로 보낸다 */
  onSelectCustomer: (customerId: string) => void;
}

/** clientInfo 안에 course 가 자유 문자열로 들어간다 ('1WAY', '3WAY', '1WAY (신규 이식 · 개발)' 등) */
function courseOf(c: ConsultationRecord): string {
  return (c.clientInfo as unknown as { course?: string })?.course || '';
}

/** 최종 이미지타입 — 'new' 코스는 threeWay 안에, 기존 코스는 faceImageType 에 있다 */
function imageTypeOf(c: ConsultationRecord): string {
  const three = (c.clientInfo as unknown as {
    threeWay?: { consultData?: { finalImageType?: { en?: string; ko?: string } } };
  })?.threeWay;
  const t = three?.consultData?.finalImageType;
  if (t?.en) return `${t.en}${t.ko ? ` · ${t.ko}` : ''}`;
  return c.faceImageType?.type || '';
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ko-KR');
}

export function ConsultationHistoryList({ token, onSelectCustomer }: Props) {
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState<CourseFilter>('전체');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    // loading 초기값이 true 라 여기서 다시 켜지 않는다 (effect 안에서 동기 setState 는 렌더가 겹친다)
    getAllConsultations(token)
      .then(setRecords)
      .catch(() => setError('상담 이력을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [token]);

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return records
      .filter((c) => filterCourse === '전체' || courseOf(c).toUpperCase().includes(filterCourse))
      .filter((c) => {
        if (!q) return true;
        const name = (c.clientInfo?.name || '').toLowerCase();
        const phone = (c.clientInfo?.phone || '').replace(/\D/g, '');
        return name.includes(q) || (digits ? phone.includes(digits) : false);
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [records, searchQuery, filterCourse]);

  return (
    <div className="px-8 py-16">
      <div className="max-w-3xl mx-auto">
        {/* 상단 헤더 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h1 className="text-[2rem] tracking-[0.12em] text-[#111111] mb-4" style={{ fontWeight: 400 }}>
            고객 상담 이력
          </h1>
          <p
            className="text-[15px] leading-[1.8] tracking-[0.02em] text-[#6F6F6F]"
            style={{ fontWeight: 300 }}
          >
            이전 상담 내용을 조회하고 설계 히스토리를 확인하세요
          </p>
        </motion.div>

        {/* 검색 영역 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-12"
        >
          <div className="max-w-[720px] mx-auto">
            <div className="relative mb-6">
              <Search
                className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6F6F6F]"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름 또는 연락처로 검색"
                className="w-full pl-8 pr-0 py-3 border-0 border-b border-[#E5E5E5] bg-transparent text-[15px] text-[#111111] placeholder:text-[#CCCCCC] focus:outline-none focus:border-[#111111] transition-colors duration-200"
                style={{ fontWeight: 300 }}
              />
            </div>

            <div className="flex gap-2 justify-center">
              {COURSE_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterCourse(f)}
                  className={`px-6 py-2 text-[13px] tracking-[0.02em] transition-all duration-200 ${
                    filterCourse === f
                      ? 'text-[#111111] border-b border-[#111111]'
                      : 'text-[#6F6F6F] border-b border-transparent hover:text-[#111111]'
                  }`}
                  style={{ fontWeight: filterCourse === f ? 400 : 300 }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 목록 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-0"
        >
          {loading ? (
            <div className="text-center py-20">
              <p className="text-[15px] text-[#6F6F6F]" style={{ fontWeight: 300 }}>로딩 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-[15px] text-[#C0392B]" style={{ fontWeight: 300 }}>{error}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[15px] text-[#6F6F6F]" style={{ fontWeight: 300 }}>
                {searchQuery || filterCourse !== '전체'
                  ? '검색 결과가 없습니다'
                  : '저장된 상담 이력이 없습니다'}
              </p>
            </div>
          ) : (
            rows.map((c) => {
              const isSelected = selectedId === c.id;
              const imageType = imageTypeOf(c);
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedId(c.id);
                    if (c.customerId) onSelectCustomer(c.customerId);
                  }}
                  className={`w-full text-left py-6 px-4 border-b border-[#E5E5E5] transition-all duration-200 hover:bg-[#FAFAFA] relative ${
                    isSelected
                      ? 'bg-[#FAFAFA] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-[#111111]'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3
                        className="text-[17px] text-[#111111] mb-1"
                        style={{ fontWeight: isSelected ? 500 : 400 }}
                      >
                        {c.clientInfo?.name || '이름 없음'}
                      </h3>
                      <p className="text-[13px] text-[#6F6F6F]" style={{ fontWeight: 300 }}>
                        {c.clientInfo?.phone || '-'}
                      </p>
                      {imageType && (
                        <p className="text-[13px] text-[#6F6F6F]" style={{ fontWeight: 300 }}>
                          {imageType}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[13px] text-[#111111]" style={{ fontWeight: 400 }}>
                        {courseOf(c) || '-'}
                      </p>
                      <p className="text-[13px] text-[#6F6F6F]" style={{ fontWeight: 300 }}>
                        {formatDate(c.createdAt)}
                      </p>
                      {c.designerName && (
                        <p className="text-[13px] text-[#6F6F6F]" style={{ fontWeight: 300 }}>
                          {c.designerName}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
}
