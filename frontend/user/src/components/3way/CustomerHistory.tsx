import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ArrowLeft } from 'lucide-react';
import { getCustomers, searchCustomers } from '@/utils/3way-api';

interface CustomerHistoryProps {
  onHistoryDetail: (customer: CustomerRecord, consult: ConsultRecord) => void;
  onBack?: () => void;
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

export function CustomerHistory({ onHistoryDetail, onBack }: CustomerHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState<'전체' | '1WAY' | '2WAY' | '3WAY'>('전체');
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const courseFilters = ['전체', '1WAY', '2WAY', '3WAY'];

  // 초기 데이터 로드
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await getCustomers();
      setCustomers(response.customers || []);
    } catch (error) {
      console.error('고객 목록 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 검색 실행
  useEffect(() => {
    if (searchQuery) {
      const delayDebounce = setTimeout(async () => {
        try {
          const response = await searchCustomers(searchQuery);
          setCustomers(response.customers || []);
        } catch (error) {
          console.error('검색 실패:', error);
        }
      }, 300);

      return () => clearTimeout(delayDebounce);
    } else {
      loadCustomers();
    }
  }, [searchQuery]);

  // 검색 결과 필터링
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    const matchesCourse =
      filterCourse === '전체' || customer.course === filterCourse;
    return matchesSearch && matchesCourse;
  });

  const handleCustomerClick = (customer: CustomerRecord) => {
    setSelectedCustomer(customer);
    // 상세 이력을 가져오는 로직이 필요합니다.
    // 예를 들어, 서버에서 해당 고객의 상세 이력을 가져오는 API 호출이 필요할 수 있습니다.
    const consult: ConsultRecord = {
      date: customer.lastVisit,
      course: customer.course,
      imageType: customer.imageType,
      colorType: '색상 유형 예시',
      design: '디자인 예시',
      notes: '메모 예시',
      customerName: customer.name,
      phone: customer.phone,
      designerName: customer.designerName,
      cycleData: '사이클 데이터 예시',
    };
    onHistoryDetail(customer, consult);
  };

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
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#6F6F6F] hover:text-[#111111] transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-[13px] tracking-[0.02em]" style={{ fontWeight: 300 }}>
                메인으로
              </span>
            </button>
          )}
          
          <h2 className="text-2xl font-semibold text-[#111111] tracking-[-0.01em] mb-3">
            고객 상담 이력
          </h2>
          <p className="text-sm text-[#999999]">
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
            {/* 검색창 */}
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

            {/* 필터 버튼 */}
            <div className="flex gap-2 justify-center">
              {courseFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterCourse(filter as typeof filterCourse)}
                  className={`
                    px-6 py-2 text-[13px] tracking-[0.02em] transition-all duration-200
                    ${
                      filterCourse === filter
                        ? 'text-[#111111] border-b border-[#111111]'
                        : 'text-[#6F6F6F] border-b border-transparent hover:text-[#111111]'
                    }
                  `}
                  style={{ fontWeight: filterCourse === filter ? 400 : 300 }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 검색 결과 리스트 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-0"
        >
          {loading ? (
            <div className="text-center py-20">
              <p className="text-[15px] text-[#6F6F6F]" style={{ fontWeight: 300 }}>
                로딩 중...
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[15px] text-[#6F6F6F]" style={{ fontWeight: 300 }}>
                {searchQuery
                  ? '검색 결과가 없습니다'
                  : '저장된 상담 이력이 없습니다'}
              </p>
            </div>
          ) : (
            filteredCustomers.map((customer, index) => (
              <button
                key={index}
                onClick={() => handleCustomerClick(customer)}
                className={`
                  w-full text-left py-6 px-4 border-b border-[#E5E5E5] transition-all duration-200
                  hover:bg-[#FAFAFA] relative
                  ${
                    selectedCustomer?.phone === customer.phone
                      ? 'bg-[#FAFAFA] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-[#111111]'
                      : ''
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3
                      className="text-[17px] text-[#111111] mb-1"
                      style={{
                        fontWeight:
                          selectedCustomer?.phone === customer.phone ? 500 : 400,
                      }}
                    >
                      {customer.name}
                    </h3>
                    <p
                      className="text-[13px] text-[#6F6F6F]"
                      style={{ fontWeight: 300 }}
                    >
                      {customer.phone}
                    </p>
                    {customer.imageType && (
                      <p
                        className="text-[13px] text-[#6F6F6F]"
                        style={{ fontWeight: 300 }}
                      >
                        {customer.imageType}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <p
                      className="text-[13px] text-[#111111]"
                      style={{ fontWeight: 400 }}
                    >
                      {customer.course}
                    </p>
                    <p
                      className="text-[13px] text-[#6F6F6F]"
                      style={{ fontWeight: 300 }}
                    >
                      {customer.lastVisit}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}