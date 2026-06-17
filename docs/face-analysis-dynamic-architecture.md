# 얼굴분석 모듈 — 동적 구조 설계 (응답 스펙 / 프론트 렌더링 / 수정 오버레이)

> **목표**: SNH·WNC 측정 모듈이 앞으로 계속 추가되는 미래를 전제로,
> "Python 분석 → DB 저장 → 웹 표시 → 측정 이상 시 디자이너 수정" 플로우를 **하드코딩 없이** 지탱하는 구조.
>
> **핵심 원칙(SSOT)**: 서버 응답이 "어떤 모듈이 있고 / 이름·측정값이 뭔지"의 단일 진실원천.
> 프론트는 그걸 **그대로 그린다**. 디자이너 수정은 **원본을 안 건드리고 오버레이로** 얹는다.

---

## 0. 현황 (이 설계의 출발점)

- 서버 응답(`AnalyzeResponse`)은 이미 모듈별 `{ name, grade, value, description, measurement }` + 그룹별 `{ final, counts, results }` 를 보냄. → [face-analysis-api.ts](../frontend/user/src/utils/face-analysis-api.ts)
- **모듈 레지스트리**는 [face_landmark/analyze_face.py](../../face_landmark/analyze_face.py) 의 dict (key → name + module 경로). WNC 10개, SNH 12개(7·8 결번).
- **문제**: 프론트 [FaceAnalysisResult.tsx](../frontend/user/src/components/3way/FaceAnalysisResult.tsx) 가 `WNC_KEY_BY_LABEL`·base 배열에 **라벨·모듈번호·표시여부를 하드코딩** → 모듈 추가/라벨변경마다 프론트 수정. ("코 폭이 죽은 모듈에 묶임" 류 버그의 근원)
- **원본 저장**: `face_analysis_results`(jsonb, 모듈번호 키) — 모듈 추가에 스키마 무손상.
- **컨설팅 저장**: `consultation.client_info.threeWay.faceAnalysis = { wncId, snhId, wncFinal, snhFinal, ratios, summaryItems, warmCool[], softHard[] }`.

---

## 1. 응답 스펙 (서버 → 웹 contract)

### 모듈 객체 — 기존 + 표시 메타 추가
```ts
AnalysisModule {
  // 기존 (그대로)
  name: string            // 라벨의 SSOT — 예 "코 너비"
  grade: 'W'|'N'|'C' | 'S'|'N'|'H'
  value?: number | null   // 측정 수치 (있으면)
  description?: string
  measurement?: {...}     // 오버레이 도형

  // 신규 (표시 제어) — 전부 optional, 서버가 소유
  display?: boolean       // 표 노출 여부 (기본 true)
  order?: number          // 정렬 순서 (기본 큰 값 → 뒤로)
  unit?: string           // value 표기 보조 (예 ':1', 'cm')
}
```
- **그룹 레벨은 기존 유지**: `wnc/snh = { final, counts, results: { '<key>': AnalysisModule } }`
- 모듈 추가 = `analyze_face.py` 레지스트리에 등록 + `display`/`order` 지정. **프론트 무수정.**
- **하위호환**: `display` 없으면 프론트가 `true` 로 간주. (과도기 Phase 1 은 프론트 화이트리스트로 노출 제어 → Phase 2 에서 서버 메타로 이관)

### 번호 정책 (불변)
- **모듈 번호는 재배열하지 않는다.** 번호 = Python·프론트·`face_analysis_results` 과거 데이터의 공통 키(contract). 결번(7·8)도 그대로 둔다.

---

## 2. 프론트 렌더링 (하드코딩 제거)

### 변환: 응답 → 표 rows (순회)
```ts
function toRows(group: WNCResult | SNHResult) {
  return Object.entries(group.results)
    .map(([key, m]) => ({
      key,
      label: m.name,              // 서버 name = 라벨
      grade: (m.grade ?? 'N').toUpperCase(),
      value: m.value ?? null,
      display: m.display ?? true,
      order: m.order ?? 999,
    }))
    .filter(r => r.display)
    .sort((a, b) => a.order - b.order);
}
```
→ `WNC_KEY_BY_LABEL` / `SNH_KEY_BY_LABEL` / base 배열 **전부 삭제**.

### 표시 + 수정
- 각 row: `label` + 3칸(W/N/C 또는 S/N/H). **유효 grade** 위치에 체크/강조.
- 클릭으로 grade 변경 → **오버레이에 기록**(원본 불변).
- `유효 grade(key) = overrides[key]?.grade ?? raw grade`
- `final = 유효 grade 다수결` 로 **재계산** (서버 counts 대신 유효값 기준).
- value 표시(있으면) + 필요 시 value 수정 → 오버레이 `value`.

### 효과
- 모듈 추가 시 자동 등장 / "죽은 모듈에 라벨 묶임" 구조적으로 불가능 (서버가 보낸 것만 그림).

---

## 3. 수정 오버레이 구조 (원본 보존)

### 저장 형태 — `consultation … faceAnalysis`
```ts
faceAnalysis: {
  wncId, snhId,                 // 원본 분석 레코드 참조 (face_analysis_results)
  overrides: {
    wnc: { '<key>': { grade?: 'W'|'N'|'C'; value?: number } },
    snh: { '<key>': { grade?: 'S'|'N'|'H'; value?: number } },
  },
  wncFinal, snhFinal,           // 오버레이 반영 재계산된 최종
  faceImageUrl,
}
```
- **원본**(`face_analysis_results`)은 **불변**. 디자이너 수정분만 `overrides` diff 로 저장.
- 조회 시 `원본 + overrides` 병합해 표시 → "원본 vs 수정" 추적 가능.
- 모듈 추가돼도 overrides 는 key 기반이라 **구조 불변**.

### 기존 필드 대체
- 현재 `warmCool[]`·`softHard[]`(label+selectedType 전체 스냅샷) → **overrides(diff)로 대체**. 더 작고 모듈 증가에 강함.
- `ratios`(F1): value 가진 모듈로 흡수 — 중안부=모듈11 value, 얼굴비율=모듈2 value. 상중하(소스 없음)는 별도 수동 필드 유지.
- `summaryItems`(step8): 별도 트랙(디자이너 조건) — 이 설계 범위 밖, 추후 연결.

---

## 4. 단계별 구현 계획

| 단계 | 내용 | 영역 | 크기 | 독립배포 |
|:--:|------|------|:--:|:--:|
| **P0** | 본 설계 확정 + 아래 "미결정" 합의 | — | 🟢 | — |
| **P1** | 프론트 표 **동적 렌더링** (응답 순회, 라벨=name, 하드코딩 맵 제거). 표시/순서는 임시 프론트 화이트리스트 | user FE | 🟡 중 | ✅ |
| **P2** | 서버 모듈에 `display`/`order`/`unit` 메타 추가 → 프론트가 화이트리스트 대신 서버 메타 사용 | Python + FE | 🟢 소 | ✅ |
| **P3** | **오버레이 저장**: 백엔드 저장/조회 + 프론트 수정→override 반영 + final 재계산. 기존 warmCool/softHard 대체 | BE + FE | 🟡 중 | ✅ |
| **P4** | admin 컨설팅 상세에서 동일 렌더링 재사용 (TODO F3) | admin FE | 🟢 소 | ✅ |

- **P1 만으로도** 하드코딩/죽은모듈 문제 해소 → 가장 먼저, 단독으로 가치 큼.
- 각 단계 독립 배포 가능하게 설계 (P1 은 응답 스펙 변경 없이 가능).

---

## 5. 호환 / 마이그레이션

- **과거 consultation** (`warmCool[]`/`softHard[]` 형태) → 조회 시 레거시 분기로 함께 읽기 (표시용). 신규는 overrides.
- **`face_analysis_results` 원본** 변경 없음 (jsonb, 모듈 추가 무손상).
- **번호 재배열 금지** → 과거 데이터·contract 보존.
- P2 서버 메타 배포 전까지 프론트는 `display` 미존재 → 화이트리스트 fallback.

---

## 6. 미결정 사항 (P0 합의 필요)

1. **표시/순서 소유** — 서버 메타(`display`/`order`) 권장 vs 프론트 화이트리스트 유지? (권장: 서버, 과도기 프론트 fallback)
2. **라벨 카피 변경 빈도** — 서버 `name` 단일소스로 충분 vs 자주 바뀌면 `모듈key→라벨` 오버라이드맵(DB)? (권장: 우선 서버 name)
3. **수정 범위** — grade(분류)만 수정 vs value(수치)도 수정?
4. **현재 안 쓰는 9개 모듈**(WNC 4·7·10 / SNH 1·3·6·9·12·14) — 기본 숨김으로 두되 `display:false`? 일부 표에 추가?
5. **상중하 비율**(소스 없음) — 수동 입력 필드로 유지 vs 서버 신규 모듈로 추가?

---

## 7. 안 건드릴 것 (못박기)
- 모듈 **번호 재배열 금지**.
- `face_analysis_results` **스키마 변경 불필요**.
- P1·P2 는 **응답 데이터 호환**(필드 추가만, 제거 없음).
