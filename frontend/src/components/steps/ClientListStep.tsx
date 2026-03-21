'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ArrowLeft, User, Calendar, Trash2 } from 'lucide-react';
import { getAllCustomers, deleteCustomer } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { Customer } from '@/types';
import { toast } from 'sonner';

interface ClientListStepProps {
  onBack: () => void;
  onSelectClient: (client: Customer) => void;
}

export const ClientListStep = ({ onBack, onSelectClient }: ClientListStepProps) => {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllCustomers(token!);
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('고객 목록 로드 실패:', error);
      toast.error('고객 목록을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) => c.name.toLowerCase().includes(q) || c.phone.includes(searchQuery)
        )
      );
    }
  }, [searchQuery, customers]);

  const handleDelete = async (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    if (!window.confirm(`${customer.name} 고객을 삭제하시겠습니까?`)) return;
    try {
      await deleteCustomer(token!, customer.id);
      toast.success('고객이 삭제되었습니다');
      loadCustomers();
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-[#E5E5E5] z-10">
        <div className="max-w-[1200px] mx-auto px-6 md:px-20 py-6 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-[#111111] hover:text-[#555555] transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm">돌아가기</span>
          </button>
          <h1 className="text-xl font-semibold text-[#111111]">고객 목록</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 md:px-20 pt-32 pb-20">
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999999]" size={20} />
            <input
              type="text"
              placeholder="이름 또는 전화번호로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 border border-[#E5E5E5] text-[15px] focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <p className="text-sm text-[#777777]">총 {filteredCustomers.length}명의 고객</p>
          <button onClick={loadCustomers} className="text-xs text-[#777777] hover:text-[#111111] px-3 py-1 border border-[#E5E5E5] rounded hover:border-[#111111] transition-colors">
            새로고침
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#111111] mx-auto mb-4" />
            <p className="text-[#999999] text-sm">로딩 중...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-20">
            <User size={48} className="mx-auto mb-4 text-[#CCCCCC]" />
            <p className="text-[#999999] text-sm">
              {searchQuery ? '검색 결과가 없습니다.' : '저장된 고객이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => onSelectClient(customer)}
                className="border border-[#E5E5E5] p-6 hover:border-[#111111] transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[#111111]">{customer.name}</h3>
                      {customer.gender && (
                        <span className="px-2 py-1 bg-[#F5F5F5] text-[#555555] text-xs">
                          {customer.gender === 'female' ? '여성' : '남성'}
                        </span>
                      )}
                      {customer.age_group && (
                        <span className="px-2 py-1 bg-[#F5F5F5] text-[#555555] text-xs">{customer.age_group}</span>
                      )}
                    </div>
                    {customer.phone && <p className="text-sm text-[#777777] mb-1">전화번호: {customer.phone}</p>}
                    {customer.memo && <p className="text-sm text-[#777777] mb-1">메모: {customer.memo}</p>}
                    {customer.created_at && (
                      <div className="flex items-center gap-1 text-xs text-[#999999]">
                        <Calendar size={12} />
                        <span>{formatDate(customer.created_at)}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, customer)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-[#F5F5F5]"
                  >
                    <Trash2 size={18} className="text-[#999999] hover:text-[#111111]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
