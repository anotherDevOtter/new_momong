'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminHeader from '@/components/AdminHeader';
import { getAdminUsers, approveUser, rejectUser } from '@/utils/api';
import { getAdminToken } from '@/utils/auth';
import type { AdminUser } from '@/utils/api';

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_LABELS: Record<AdminUser['status'], string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거절됨',
};

const STATUS_CLASSES: Record<AdminUser['status'], string> = {
  pending: 'border border-yellow-400 text-yellow-700 bg-yellow-50',
  approved: 'border border-green-400 text-green-700 bg-green-50',
  rejected: 'border border-red-400 text-red-600 bg-red-50',
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        const data = await getAdminUsers(token);
        setUsers(data);
      } catch {
        toast.error('유저 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const handleApprove = async (userId: string) => {
    const token = getAdminToken();
    if (!token) return;
    try {
      await approveUser(token, userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'approved' as const } : u))
      );
      toast.success('승인되었습니다.');
    } catch {
      toast.error('승인에 실패했습니다.');
    }
  };

  const handleReject = async (userId: string) => {
    const token = getAdminToken();
    if (!token) return;
    try {
      await rejectUser(token, userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'rejected' as const } : u))
      );
      toast.success('거절되었습니다.');
    } catch {
      toast.error('거절에 실패했습니다.');
    }
  };

  const filteredUsers = users
    .filter((u) => activeTab === 'all' || u.status === activeTab)
    .filter((u) => {
      const q = search.toLowerCase();
      return (
        u.storeName.toLowerCase().includes(q) ||
        u.ownerName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'pending', label: '승인 대기' },
    { key: 'approved', label: '승인됨' },
    { key: 'rejected', label: '거절됨' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <AdminHeader currentPath="/users" />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-sm font-medium text-[#111111] tracking-wide">전체 유저</h1>
          <input
            type="text"
            placeholder="매장명, 대표명, 이메일 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-[#E5E5E5] px-3 py-2 text-sm text-[#111111] placeholder-[#BBBBBB] outline-none focus:border-[#111111] transition-colors w-64"
          />
        </div>

        <div className="flex gap-1 mb-6 border-b border-[#E5E5E5]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-b-2 border-[#111111] text-[#111111] font-medium'
                  : 'text-[#999999] hover:text-[#111111]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-sm text-[#999999]">불러오는 중...</div>
        ) : (
          <div className="border border-[#E5E5E5]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#999999]">매장명</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#999999]">대표명</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#999999]">이메일</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#999999]">연락처</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#999999]">상태</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#999999]">가입일</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#999999]">컨설팅 수</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#999999]">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-[#999999]">
                      유저가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-4 py-3 text-[#111111]">{user.storeName}</td>
                      <td className="px-4 py-3 text-[#111111]">{user.ownerName}</td>
                      <td className="px-4 py-3 text-[#555555]">{user.email}</td>
                      <td className="px-4 py-3 text-[#555555]">{user.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 ${STATUS_CLASSES[user.status]}`}
                        >
                          {STATUS_LABELS[user.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#555555]">
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-[#555555]">{user.consultationCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {user.status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(user.id)}
                              className="border border-green-500 text-green-600 text-xs px-2.5 py-1 hover:bg-green-50 transition-colors"
                            >
                              승인
                            </button>
                          )}
                          {user.status !== 'rejected' && (
                            <button
                              onClick={() => handleReject(user.id)}
                              className="border border-red-400 text-red-500 text-xs px-2.5 py-1 hover:bg-red-50 transition-colors"
                            >
                              거절
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
