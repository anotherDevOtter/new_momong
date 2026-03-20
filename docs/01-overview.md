# FIT 헤어컨설팅 - 프로젝트 개요

## 브랜드 & 앱 소개

- **브랜드명**: MERCI MOMONG
- **앱명**: FIT 헤어컨설팅
- **슬로건**: "Today's Design Direction" / "BE YOURSELF"
- **목적**: 헤어 디자이너가 고객 방문 시 체계적인 헤어 컨설팅을 진행하고, 결과를 기록·공유할 수 있는 디지털 컨설팅 도구

## 핵심 가치

> 오늘 나에게 가장 어울리는 디자인을 제안합니다.
> 얼굴과 이미지 컨디션에 따라 FIT은 달라질 수 있습니다.

## 주요 기능 요약

| 기능 | 설명 |
|------|------|
| 컨설팅 플로우 | 12단계 스텝 기반의 헤어 컨설팅 진행 |
| 고객 관리 | 고객 정보 저장, 검색, 방문 이력 조회 |
| 이미지 타입 분석 | WARM / NEUTRAL / COOL 타입 진단 (이목구비 분석) |
| 헤어 상태 진단 | 모발 손상도, 모질, 두께, 밀도, 웨이브 분석 |
| Today Design | 길이, 앞머리, 컬/질감, 컬러 결과 기록 |
| Next Direction | 다음 방문 디자인 방향 제안 |
| After Note | 디자인 사이클 가이드 + 디자이너 메모 |
| PDF 출력 | 컨설팅 결과를 A4 PDF로 저장/출력 |

## 대상 사용자

- **디자이너 (주 사용자)**: 고객 컨설팅 시 태블릿/PC에서 사용
- **고객 (간접 사용자)**: 컨설팅 과정에 참여하고 After Note PDF를 받음

## 기술 스택 (Figma Make 원본)

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| 데이터베이스 | Supabase (PostgreSQL) |
| 서버 함수 | Supabase Edge Functions (Deno + Hono) |
| 데이터 저장 | Supabase KV Store (컨설팅) + PostgreSQL (고객) |
| PDF | html2canvas + jsPDF |

## 목표 기술 스택 (전환 후)

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Next.js 14+ (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 백엔드 | NestJS + TypeScript |
| 데이터베이스 | PostgreSQL (Supabase 또는 자체 호스팅) |
| ORM | TypeORM 또는 Prisma |
| 인증 | JWT (추후 확장) |
| PDF | html2canvas + jsPDF (유지) |

## 디렉토리 구조 (목표)

```
new_momong/
├── figma/              # Figma Make 원본 (참조용)
├── docs/               # 기획 문서
│   ├── 01-overview.md
│   ├── 02-screens-flow.md
│   ├── 03-data-models.md
│   └── 04-api-spec.md
├── frontend/           # Next.js 프론트엔드
└── backend/            # NestJS 백엔드
```
