'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminHeader from '@/components/AdminHeader';
import { getAdminStats, getAdminUsers, approveUser, rejectUser } from '@/utils/api';
import { getAdminToken } from '@/utils/auth';
import type { AdminStats, AdminUser } from '@/utils/api';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [statsData, usersData] = await Promise.all([
          getAdminStats(token),
          getAdminUsers(token),
        ]);
        setStats(statsData);
        setPendingUsers(usersData.filter((u) => u.status === 'pending'));
      } catch {
        toast.error('데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleApprove = async (userId: string) => {
    const token = getAdminToken();
    if (!token) return;
    try {
      await approveUser(token, userId);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      setStats((prev) =>
        prev
          ? {
              ...prev,
              pendingUsers: prev.pendingUsers - 1,
              approvedUsers: prev.approvedUsers + 1,
            }
          : prev
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
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      setStats((prev) =>
        prev
          ? {
              ...prev,
              pendingUsers: prev.pendingUsers - 1,
              rejectedUsers: prev.rejectedUsers + 1,
            }
          : prev
      );
      toast.success('거절되었습니다.');
    } catch {
      toast.error('거절에 실패했습니다.');
    }
  };

  const statCards = stats
    ? [
        { label: '총 유저', value: stats.totalUsers },
        { label: '승인 대기', value: stats.pendingUsers },
        { label: '승인됨', value: stats.approvedUsers },
        { label: '총 컨설팅', value: stats.totalConsultations },
      ]
    : [];

  return (
    <div className="min-h-screen bg-white">
      <AdminHeader currentPath="/dashboard" />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <div className="text-sm text-[#999999]">불러오는 중...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="border border-[#E5E5E5] p-6"
                >
                  <p className="text-3xl font-light text-[#111111] mb-1">{card.value}</p>
                  <p className="text-xs text-[#999999]">{card.label}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-sm font-medium text-[#111111] mb-4 tracking-wide">
                승인 대기 유저
              </h2>
              {pendingUsers.length === 0 ? (
                <p className="text-sm text-[#999999]">승인 대기 중인 유저가 없습니다.</p>
              ) : (
                <div className="border border-[#E5E5E5] divide-y divide-[#E5E5E5]">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#111111]">{user.storeName}</p>
                        <p className="text-xs text-[#999999] mt-0.5">
                          {user.ownerName} · {user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="border border-green-500 text-green-600 text-xs px-3 py-1.5 hover:bg-green-50 transition-colors"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(user.id)}
                          className="border border-red-400 text-red-500 text-xs px-3 py-1.5 hover:bg-red-50 transition-colors"
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
