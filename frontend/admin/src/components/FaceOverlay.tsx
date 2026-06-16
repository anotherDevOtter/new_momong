'use client';

/**
 * 원본 얼굴 이미지 위에 Python 서버가 반환한 measurement.shapes 를 SVG 오버레이로 렌더.
 *
 * 좌표는 원본 이미지 절대 픽셀 (image_size 기준). SVG viewBox 로 자동 스케일.
 */

export interface Point {
  x: number;
  y: number;
  label?: string;
}

export type MeasurementShape =
  | { type: 'point'; point: Point; color?: string; label?: string }
  | { type: 'line' | 'polyline' | 'polygon' | 'rectangle'; points: Point[]; stroke?: string; stroke_width?: number; fill?: string; dashed?: boolean; label?: string }
  | { type: 'circle'; point: Point; radius: number; stroke?: string; stroke_width?: number; fill?: string; dashed?: boolean; label?: string }
  | { type: 'text'; point: Point; text: string; color?: string; font_size?: number };

export interface Measurement {
  image_size: { width: number; height: number };
  shapes: MeasurementShape[];
}

interface FaceOverlayProps {
  imageUrl: string;
  measurement?: Measurement | null;
  /** 가로 최대치. 비율은 image_size 로 결정. 기본 480 */
  maxWidth?: number;
  alt?: string;
}

const DEFAULT_STROKE = '#FFFFFF';
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_FONT_SIZE = 16;

export function FaceOverlay({ imageUrl, measurement, maxWidth = 480, alt = 'Face' }: FaceOverlayProps) {
  const size = measurement?.image_size;

  return (
    <div className="relative inline-block" style={{ maxWidth }}>
      <img src={imageUrl} alt={alt} className="block w-full h-auto" />
      {size && measurement && (
        <svg
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {measurement.shapes.map((s, i) => (
            <Shape key={i} shape={s} />
          ))}
        </svg>
      )}
    </div>
  );
}

function Shape({ shape }: { shape: MeasurementShape }) {
  const stroke = ('stroke' in shape && shape.stroke) || DEFAULT_STROKE;
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
          fill={shape.color || DEFAULT_STROKE}
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

    case 'circle':
      return (
        <circle
          cx={shape.point.x}
          cy={shape.point.y}
          r={shape.radius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
        />
      );

    case 'text':
      return (
        <text
          x={shape.point.x}
          y={shape.point.y}
          fill={shape.color || DEFAULT_STROKE}
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
