import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Download } from 'lucide-react';
import { getConsults } from '@/utils/3way-api';

interface CustomerHistoryDetailProps {
  customer: CustomerRecord | null;
  consult: ConsultRecord | null;
  onBack: () => void;
}

export interface CustomerRecord {
  name: string;
  phone: string;
  lastVisit: string;
  course: string;
  imageType?: string;
  designerName?: string;
}

export interface ConsultRecord {
  date: string;
  course: string;
  imageType?: string;
  colorType?: string;
  design?: string;
  notes?: string;
  customerName: string;
  phone: string;
  designerName?: string;
  cycleData?: any;
}

export function CustomerHistoryDetail({
  customer,
  consult,
  onBack,
}: CustomerHistoryDetailProps) {
  const [consultRecords, setConsultRecords] = useState<ConsultRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customer?.phone) {
      loadConsults();
    }
  }, [customer]);

  const loadConsults = async () => {
    if (!customer?.phone) return;
    
    try {
      setLoading(true);
      const response = await getConsults(customer.phone);
      setConsultRecords(response.consults || []);
    } catch (error) {
      console.error('상담 이력 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!customer || !consult) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">데이터 로딩 중...</p>
      </div>
    );
  }

  const [selectedRecord, setSelectedRecord] = useState<ConsultRecord | null>(null);

  return (
    <div className="min-h-screen bg-white px-8 pt-24 pb-40">
      <div className="max-w-4xl mx-auto">
        {/* 상단 헤더 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#6F6F6F] hover:text-[#111111] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-[13px] tracking-[0.02em]" style={{ fontWeight: 300 }}>
              목록으로
            </span>
          </button>

          <h1
            className="text-[2rem] tracking-[0.12em] text-[#111111] mb-6"
            style={{ fontWeight: 400 }}
          >
            상담 기록
          </h1>

          {/* 고객 기본 정보 */}
          <div className="space-y-2 mb-12 pb-8 border-b border-[#E5E5E5]">
            <p className="text-[17px] text-[#111111]" style={{ fontWeight: 400 }}>
              {customer.name}
            </p>
            <p className="text-[15px] text-[#6F6F6F]" style={{ fontWeight: 300 }}>
              {customer.phone}
            </p>
            <p className="text-[15px] text-[#6F6F6F]" style={{ fontWeight: 300 }}>
              최근 방문: {customer.lastVisit}
            </p>
          </div>
        </motion.div>

        {/* 타임라인 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="space-y-0 mb-12"
        >
          {loading ? (
            <p className="text-gray-600">상담 이력 로딩 중...</p>
          ) : (
            consultRecords.map((record, index) => (
              <div
                key={index}
                className="border-b border-[#E5E5E5] py-8 relative pl-8"
              >
                {/* 타임라인 선 */}
                {index !== consultRecords.length - 1 && (
                  <div className="absolute left-[7px] top-12 bottom-0 w-[1px] bg-[#E5E5E5]" />
                )}

                {/* 타임라인 점 */}
                <div className="absolute left-0 top-10 w-[15px] h-[15px] rounded-full border-2 border-[#111111] bg-white" />

                <div className="space-y-3">
                  <p className="text-[15px] text-[#111111]" style={{ fontWeight: 400 }}>
                    {record.date}
                  </p>
                  <p
                    className="text-[13px] text-[#6F6F6F] tracking-[0.02em]"
                    style={{ fontWeight: 300 }}
                  >
                    {record.course}
                  </p>

                  {record.imageType && (
                    <p className="text-[15px] text-[#111111]" style={{ fontWeight: 300 }}>
                      이미지 타입: {record.imageType}
                    </p>
                  )}

                  {record.colorType && (
                    <p className="text-[15px] text-[#111111]" style={{ fontWeight: 300 }}>
                      컬러 타입: {record.colorType}
                    </p>
                  )}

                  {record.design && (
                    <p className="text-[15px] text-[#111111]" style={{ fontWeight: 300 }}>
                      디자인: {record.design}
                    </p>
                  )}

                  {record.notes && (
                    <p
                      className="text-[13px] text-[#6F6F6F] leading-[1.8] mt-4"
                      style={{ fontWeight: 300 }}
                    >
                      {record.notes}
                    </p>
                  )}

                  {/* 버튼 */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => alert('리포트 보기 기능 구현 예정')}
                      className="text-[13px] text-[#111111] hover:text-[#6F6F6F] transition-colors border-b border-[#111111] hover:border-[#6F6F6F]"
                      style={{ fontWeight: 300 }}
                    >
                      리포트 보기
                    </button>
                    <button
                      onClick={() => alert('새 상담 시작 기능 구현 예정')}
                      className="text-[13px] text-[#6F6F6F] hover:text-[#111111] transition-colors border-b border-transparent hover:border-[#111111]"
                      style={{ fontWeight: 300 }}
                    >
                      이 설계 기반으로 새 상담 시작
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* 하단 액션 버튼 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex justify-center pt-8"
        >
          <button
            onClick={() => alert('새 상담 시작 기능 구현 예정')}
            className="px-12 py-4 bg-[#111111] text-white text-[13px] tracking-[0.08em] transition-all duration-200 hover:bg-[#222222]"
            style={{ fontWeight: 400 }}
          >
            새 상담 시작
          </button>
        </motion.div>
      </div>
    </div>
  );
}