'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminHeader from '@/components/AdminHeader';
import { getModuleConfigs, updateModuleConfig, ModuleConfig } from '@/utils/api';
import { getAdminToken } from '@/utils/auth';

type Patch = Partial<Pick<ModuleConfig, 'label' | 'order' | 'display' | 'unit'>>;

export default function FaceModulesPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<ModuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push('/login');
      return;
    }
    getModuleConfigs()
      .then(setConfigs)
      .catch(() => toast.error('모듈 설정을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [router]);

  const persist = async (id: string, patch: Patch) => {
    const token = getAdminToken();
    if (!token) return;
    setSavingId(id);
    try {
      const updated = await updateModuleConfig(token, id, patch);
      setConfigs((prev) => prev.map((c) => (c.id === id ? updated : c)));
      toast.success('저장되었습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSavingId(null);
    }
  };

  const wnc = configs.filter((c) => c.axis === 'WNC').sort((a, b) => a.order - b.order);
  const snh = configs.filter((c) => c.axis === 'SNH').sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-white">
      <AdminHeader currentPath="/face-modules" />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-lg font-medium text-[#111111] mb-2">얼굴분석 모듈 설정</h1>
        <p className="text-sm text-[#999999] mb-10">
          분석 결과 화면 표에 어떤 모듈을 어떤 라벨·순서로 보여줄지 설정합니다.
          측정값은 파이썬이 계산하고, 여기서는 표시만 조정합니다. (전역 적용)
        </p>

        {loading ? (
          <div className="text-sm text-[#999999]">불러오는 중...</div>
        ) : (
          <div className="space-y-12">
            <ModuleSection
              title="Warm / Neutral / Cool"
              rows={wnc}
              savingId={savingId}
              onSave={persist}
            />
            <ModuleSection
              title="Soft / Neutral / Hard"
              rows={snh}
              savingId={savingId}
              onSave={persist}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function ModuleSection({
  title,
  rows,
  savingId,
  onSave,
}: {
  title: string;
  rows: ModuleConfig[];
  savingId: string | null;
  onSave: (id: string, patch: Patch) => void;
}) {
  return (
    <section>
      <h2 className="text-sm font-medium text-[#111111] mb-4 tracking-wide">{title}</h2>
      <div className="border border-[#E5E5E5]">
        <div className="grid grid-cols-[64px_1fr_72px_72px_56px] gap-2 px-4 py-2 border-b border-[#E5E5E5] bg-[#FAFAFA] text-xs text-[#999999]">
          <span>표시</span>
          <span>라벨</span>
          <span>순서</span>
          <span>단위</span>
          <span className="text-right">모듈#</span>
        </div>
        <div className="divide-y divide-[#E5E5E5]">
          {rows.map((c) => (
            <ModuleRow key={c.id} config={c} saving={savingId === c.id} onSave={onSave} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ModuleRow({
  config,
  saving,
  onSave,
}: {
  config: ModuleConfig;
  saving: boolean;
  onSave: (id: string, patch: Patch) => void;
}) {
  const [label, setLabel] = useState(config.label);
  const [order, setOrder] = useState(String(config.order));
  const [unit, setUnit] = useState(config.unit ?? '');

  // 외부 갱신(저장 응답) 반영
  useEffect(() => {
    setLabel(config.label);
    setOrder(String(config.order));
    setUnit(config.unit ?? '');
  }, [config.label, config.order, config.unit]);

  const saveLabel = () => {
    const v = label.trim();
    if (v && v !== config.label) onSave(config.id, { label: v });
  };
  const saveOrder = () => {
    const n = parseInt(order, 10);
    if (!Number.isNaN(n) && n !== config.order) onSave(config.id, { order: n });
  };
  const saveUnit = () => {
    const v = unit.trim();
    if (v !== (config.unit ?? '')) onSave(config.id, { unit: v || null });
  };

  return (
    <div
      className={`grid grid-cols-[64px_1fr_72px_72px_56px] gap-2 items-center px-4 py-3 ${
        config.display ? '' : 'opacity-50'
      }`}
    >
      <button
        onClick={() => onSave(config.id, { display: !config.display })}
        disabled={saving}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          config.display ? 'bg-[#111111]' : 'bg-[#E5E5E5]'
        } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            config.display ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={saveLabel}
        disabled={saving}
        className="text-sm text-[#111111] border border-[#E5E5E5] rounded px-2 py-1 outline-none focus:border-[#111111]"
      />
      <input
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        onBlur={saveOrder}
        disabled={saving}
        inputMode="numeric"
        className="text-sm text-[#111111] border border-[#E5E5E5] rounded px-2 py-1 w-full outline-none focus:border-[#111111]"
      />
      <input
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        onBlur={saveUnit}
        disabled={saving}
        placeholder="-"
        className="text-sm text-[#111111] border border-[#E5E5E5] rounded px-2 py-1 w-full outline-none focus:border-[#111111]"
      />
      <span className="text-xs text-[#999999] text-right">{config.moduleKey}</span>
    </div>
  );
}
