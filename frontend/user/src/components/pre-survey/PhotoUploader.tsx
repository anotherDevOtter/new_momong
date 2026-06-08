'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { prepareImageForAnalysis } from '@/utils/image-resize';
import { uploadPreSurveyPhoto } from '@/utils/pre-survey-api';

interface PhotoUploaderProps {
  label: string;
  hint?: string;
  surveyToken: string;
  photos: string[];
  max: number;
  onChange: (next: string[]) => void;
  /** 서버에서 받은 raw URL → signed GET URL 매핑 (private S3 대비) */
  displayUrlMap?: Record<string, string>;
}

export function PhotoUploader({
  label,
  hint,
  surveyToken,
  photos,
  max,
  onChange,
  displayUrlMap,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  // 새로 올린 파일의 raw URL → 로컬 blob URL (서버 signed URL 받기 전까지의 미리보기)
  const [localBlobUrls, setLocalBlobUrls] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement | null>(null);

  // unmount 시에만 blob URL 해제. deps 에 localBlobUrls 를 넣으면 다음 업로드 직전에
  // 이전 blob URL 이 revoke 되면서 표시 중이던 이미지가 깨짐.
  const blobUrlsRef = useRef(localBlobUrls);
  blobUrlsRef.current = localBlobUrls;
  useEffect(() => {
    return () => {
      Object.values(blobUrlsRef.current).forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const remaining = Math.max(0, max - photos.length);

  const displayUrl = (rawUrl: string): string => {
    return localBlobUrls[rawUrl] || displayUrlMap?.[rawUrl] || rawUrl;
  };

  const handleSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      const filesToUpload = Array.from(files).slice(0, remaining);
      const newRawUrls: string[] = [];
      const newBlobMap: Record<string, string> = {};
      for (const file of filesToUpload) {
        const prepared = await prepareImageForAnalysis(file);
        const rawUrl = await uploadPreSurveyPhoto(surveyToken, prepared.file);
        newRawUrls.push(rawUrl);
        newBlobMap[rawUrl] = URL.createObjectURL(prepared.file);
      }
      setLocalBlobUrls((prev) => ({ ...prev, ...newBlobMap }));
      onChange([...photos, ...newRawUrls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '업로드 실패');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index: number) => {
    const rawUrl = photos[index];
    if (rawUrl && localBlobUrls[rawUrl]) {
      URL.revokeObjectURL(localBlobUrls[rawUrl]);
      setLocalBlobUrls((prev) => {
        const next = { ...prev };
        delete next[rawUrl];
        return next;
      });
    }
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h4 className="text-[14px] text-[#111111]" style={{ fontWeight: 600 }}>
          {label}
        </h4>
        <span className="text-[11px] text-[#7A7A7A]">
          {photos.length} / {max}
        </span>
      </div>
      {hint && (
        <p className="text-[11px] text-[#7A7A7A]" style={{ fontWeight: 400 }}>
          {hint}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {photos.map((rawUrl, i) => (
          <div
            key={`${rawUrl}-${i}`}
            className="relative aspect-square bg-[#F7F7F5] border border-[#E5E5E5] overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl(rawUrl)}
              alt={`업로드 ${i + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square border border-dashed border-[#CCCCCC] hover:border-[#B88A5A] transition-colors flex flex-col items-center justify-center gap-1 text-[#7A7A7A] hover:text-[#B88A5A] disabled:opacity-50"
          >
            <Plus size={20} strokeWidth={1.5} />
            <span className="text-[11px]" style={{ fontWeight: 400 }}>
              {uploading ? '업로드 중...' : '사진 추가'}
            </span>
          </button>
        )}
      </div>

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleSelect(e.target.files)}
      />
    </div>
  );
}
