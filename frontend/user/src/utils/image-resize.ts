// ⚠️ frontend/user 와 frontend/admin 에 동일한 복사본으로 존재한다.
//    한쪽을 고치면 반드시 나머지도 같이 고칠 것.
//    (합칠 수 없는 이유: ARCHITECTURE.md §3-1 '프론트 공통 코드 중복')

/**
 * 얼굴 분석용 이미지 전처리.
 *
 * 정책:
 *  - 가로/세로 중 더 긴 변이 MAX_DIM 보다 크거나 파일 크기가 MAX_BYTES 를 초과하면 리사이즈
 *  - 그 외에는 원본 그대로 반환 (재압축 없음 — 분석 정확도 보존)
 *  - 리사이즈 후에도 MAX_BYTES 초과하면 에러
 */

const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const MAX_DIM = 2048;
const JPEG_QUALITY = 0.92;

export interface ResizeResult {
  file: File;
  resized: boolean;
  originalSize: number;
  finalSize: number;
}

export async function prepareImageForAnalysis(file: File): Promise<ResizeResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다');
  }

  const dims = await readImageDimensions(file);
  const needsResize =
    file.size > MAX_BYTES ||
    dims.width > MAX_DIM ||
    dims.height > MAX_DIM;

  if (!needsResize) {
    return {
      file,
      resized: false,
      originalSize: file.size,
      finalSize: file.size,
    };
  }

  const resized = await resizeImage(file, dims, MAX_DIM, JPEG_QUALITY);

  if (resized.size > MAX_BYTES) {
    throw new Error(
      `이미지 크기가 너무 큽니다 (${formatMB(resized.size)} > ${formatMB(MAX_BYTES)}). 다른 사진을 선택해주세요.`,
    );
  }

  return {
    file: resized,
    resized: true,
    originalSize: file.size,
    finalSize: resized.size,
  };
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 읽을 수 없습니다'));
    };
    img.src = url;
  });
}

async function resizeImage(
  file: File,
  origDims: { width: number; height: number },
  maxDim: number,
  quality: number,
): Promise<File> {
  const scale = Math.min(maxDim / origDims.width, maxDim / origDims.height, 1);
  const targetW = Math.round(origDims.width * scale);
  const targetH = Math.round(origDims.height * scale);

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context 를 얻을 수 없습니다');
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    if (!blob) throw new Error('이미지 변환에 실패했습니다');

    return new File([blob], replaceExt(file.name, 'jpg'), { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = url;
  });
}

function replaceExt(name: string, newExt: string): string {
  const dot = name.lastIndexOf('.');
  return (dot === -1 ? name : name.substring(0, dot)) + '.' + newExt;
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}
