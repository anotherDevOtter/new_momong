'use client';

/**
 * 원본 얼굴 이미지 위에 Python 서버가 반환한 measurement.shapes 를 SVG 오버레이로 렌더.
 *
 * admin/src/components/FaceOverlay.tsx 에서 가져왔다. 타입만 공용(utils/face-analysis-api)으로 바꿨다.
 *
 * 좌표는 원본 이미지 절대 픽셀 (image_size 기준). SVG viewBox 로 자동 스케일.
 */

import type { Measurement, MeasurementShape } from '@/utils/face-analysis-api';

/* 타입은 utils/face-analysis-api 의 것을 그대로 쓴다 (admin 판은 자체 선언이었다) */
interface FaceOverlayProps {
  imageUrl: string;
  measurement?: Measurement | null;
  /** 가로 최대치. 비율은 image_size 로 결정. 기본 480 */
  maxWidth?: number;
  alt?: string;
  /** 선 색을 강제로 지정한다. 서버가 흰 선을 보내와도 이 값이 이긴다 */
  strokeColor?: string;
  /** 도형에 딸린 글자(수치 라벨)를 그리지 않는다 */
  hideText?: boolean;
}

const DEFAULT_STROKE = '#FFFFFF';
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_FONT_SIZE = 16;

export function FaceOverlay({ imageUrl, measurement, maxWidth = 480, alt = 'Face', strokeColor, hideText }: FaceOverlayProps) {
  const size = measurement?.image_size;

  return (
    // alignSelf:flex-start — flex 부모 안에서 늘어나면 컨테이너 높이가 이미지와 달라져
    // 절대배치된 SVG 오버레이가 어긋난다 (점이 엉뚱한 자리에 찍힘).
    <div className="relative inline-block" style={{ maxWidth, alignSelf: 'flex-start' }}>
      <img src={imageUrl} alt={alt} className="block w-full h-auto" />
      {size && measurement && (
        <svg
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {measurement.shapes
            .filter((sh) => !(hideText && sh.type === 'text'))
            .map((sh, i) => (
              <Shape key={i} shape={sh} strokeColor={strokeColor} />
            ))}
        </svg>
      )}
    </div>
  );
}

function Shape({ shape, strokeColor }: { shape: MeasurementShape; strokeColor?: string }) {
  // strokeColor 를 주면 서버가 보낸 색보다 우선한다 (흰 선이 사진에 묻히는 경우)
  const stroke = strokeColor || ('stroke' in shape && shape.stroke) || DEFAULT_STROKE;
  const strokeWidth = ('stroke_width' in shape && shape.stroke_width) || DEFAULT_STROKE_WIDTH;
  const fill = ('fill' in shape && shape.fill) || 'none';
  const dashArray = 'dashed' in shape && shape.dashed ? '6 4' : undefined;

  switch (shape.type) {
    case 'point':
      return (
        <circle
          cx={shape.point.x}
          cy={shape.point.y}
          r={4}
          fill={strokeColor || shape.color || DEFAULT_STROKE}
          stroke="white"
          strokeWidth={1}
        />
      );

    case 'line':
      if (shape.points.length < 2) return null;
      return (
        <line
          x1={shape.points[0].x}
          y1={shape.points[0].y}
          x2={shape.points[1].x}
          y2={shape.points[1].y}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
        />
      );

    case 'polyline':
      return (
        <polyline
          points={shape.points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
        />
      );

    case 'polygon':
      return (
        <polygon
          points={shape.points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
        />
      );

    case 'rectangle': {
      if (shape.points.length < 2) return null;
      const [a, b] = shape.points;
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      const w = Math.abs(b.x - a.x);
      const h = Math.abs(b.y - a.y);
      return (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
        />
      );
    }

    case 'circle': {
      const c = shape.point ?? shape.center;
      if (!c) return null;
      return (
        <circle
          cx={c.x}
          cy={c.y}
          r={shape.radius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
        />
      );
    }

    case 'text':
      return (
        <text
          x={shape.point.x}
          y={shape.point.y}
          fill={strokeColor || shape.color || DEFAULT_STROKE}
          fontSize={shape.font_size || DEFAULT_FONT_SIZE}
          fontFamily="sans-serif"
          dominantBaseline="middle"
          style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 3, strokeLinejoin: 'round' }}
        >
          {shape.text}
        </text>
      );

    default:
      return null;
  }
}
