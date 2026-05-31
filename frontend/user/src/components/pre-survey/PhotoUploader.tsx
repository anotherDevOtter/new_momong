'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
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
}

export function PhotoUploader({ label, hint, surveyToken, photos, max, onChange }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const remaining = Math.max(0, max - photos.length);

  const handleSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      const filesToUpload = Array.from(files).slice(0, remaining);
      const urls: string[] = [];
      for (const file of filesToUpload) {
        const prepared = await prepareImageForAnalysis(file);
        const url = await uploadPreSurveyPhoto(surveyToken, prepared.file);
        urls.push(url);
      }
      onChange([...photos, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '업로드 실패');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index: number) => {
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
        {photos.map((url, i) => (
          <div key={`${url}-${i}`} className="relative aspect-square bg-[#F7F7F5] border border-[#E5E5E5] overflow-hidden">
            <Image src={url} alt={`업로드 ${i + 1}`} fill className="object-cover" sizes="120px" unoptimized />
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
