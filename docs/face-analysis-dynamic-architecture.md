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

### 역할 분리 — 측정(파이썬) vs 표시(DB 설정)  ★B안 확정
- **파이썬 응답은 기존 그대로** — `AnalysisModule { name, grade, value?, description?, measurement? }`. 즉 "이 모듈이 있고 측정값은 이거다"만 보냄. **응답 스펙 변경 없음.**
- **표시(라벨·순서·노출·단위)는 DB 설정(`module_configs`)이 소유** — 디자이너가 admin에서 개발/배포 없이 조정.

### DB 설정 테이블 `module_configs` (전역)
| 컬럼 | 예 | 의미 |
|------|------|------|
| `axis` | `SNH` | WNC / SNH |
| `module_key` | `10` | 서버 응답 키 (모듈번호) |
| `label` | `코 폭` | 표시 라벨 (SSOT) |
| `order` | `50` | 정렬 (숫자, 띄엄띄엄: 10·20·30) |
| `display` | `true` | 표 노출 여부 |
| `unit` | `:1` | value 표기 보조 |
| (unique) | `(axis, module_key)` | 전역 1행/모듈 |

- **범위 = 전역** (제품 공통, user_id 없음. admin이 관리).
- **자동 생성** — 분석 응답에 **설정에 없는 module_key** 가 오면 백엔드가 `module_configs` 행을 **자동 생성**(`display:false`, `label`=서버 name, `order`=뒤). → admin에서 켜면 노출. 모듈 추가 시 프론트·운영 무수정.
- **초기 시드**: 현재 22개 모듈을 마이그레이션으로 삽입 (쓰는 13개 `display:true` + 현재 라벨/순서, 나머지 9개 `display:false`).

### 번호 정책 (불변)
- **모듈 번호는 재배열하지 않는다.** 번호 = Python·프론트·`face_analysis_results` 과거 데이터의 공통 키(contract). 결번(7·8)도 그대로 둔다.

---

## 2. 프론트 렌더링 (하드코딩 제거)

### 변환: (분석 응답 + DB 설정) 병합 → 표 rows
```ts
// configs: module_configs 조회 결과 (axis 별). analysis: 파이썬 응답.
function toRows(axisConfigs, group /* WNCResult|SNHResult */) {
  return axisConfigs
    .filter(c => c.display)
    .sort((a, b) => a.order - b.order)
    .map(c => {
      const m = group.results[c.module_key];   // 모듈번호로 직접 조회
      return {
        key: c.module_key,
        label: c.label,                         // 라벨 = DB 설정
        unit: c.unit,
        grade: (m?.grade ?? 'N').toUpperCase(),
        value: m?.value ?? null,
      };
    });
}
```
- 표시/순서/라벨/단위 = **DB 설정**. grade/value = **파이썬 응답**. 모듈번호로 병합.
- P1 의 프론트 화이트리스트(`WNC_ROWS`/`SNH_ROWS`)는 **DB 설정 조회로 대체**.

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
| **P0** ✅ | 설계 확정 (B안 + 아래 결정 합의 완료) | — | 🟢 | — |
| **P1** ✅ | 프론트 표 **동적 렌더링** (모듈번호 바인딩, 하드코딩 맵 제거). 표시/순서는 임시 프론트 화이트리스트 | user FE | 🟡 중 | ✅ |
| **P2a** | `module_configs` 테이블 + 마이그레이션 + 22개 시드 + 조회/수정 API + 새 모듈 자동생성 | 백엔드 | 🟡 중 | ✅ |
| **P2b** | 프론트(user)가 화이트리스트 대신 **DB 설정 조회해 렌더** | user FE | 🟢 소 | ✅ |
| **P2c** | admin에서 모듈 설정 편집 (토글/순서 숫자/라벨/단위) | admin FE | 🟡 중 | ✅ |
| **P3** | **오버레이 저장**: 백엔드 저장/조회 + 프론트 수정→override 반영 + final 재계산 | BE + FE | 🟡 중 | ✅ |
| **P4** | admin 컨설팅 상세에서 동일 렌더링 재사용 (TODO F3) | admin FE | 🟢 소 | ✅ |

- **P0·P1 완료.** 다음 = **P2a(백엔드 설정 테이블)**.
- P2a→P2b 는 함께 배포해야 의미 (조회 경로 전환). P2c(admin)는 그 뒤 독립.
- ⚠️ **P2a 부터 DB 마이그레이션 동반** (배포 시 운영 DB에 `module_configs` 생성 + 시드).

---

## 5. 호환 / 마이그레이션

- **과거 consultation** (`warmCool[]`/`softHard[]` 형태) → 조회 시 레거시 분기로 함께 읽기 (표시용). 신규는 overrides.
- **`face_analysis_results` 원본** 변경 없음 (jsonb, 모듈 추가 무손상).
- **번호 재배열 금지** → 과거 데이터·contract 보존.
- P2b(프론트 설정 조회) 배포 전까지는 P1 화이트리스트가 표시를 담당 → 무중단 전환.
- `module_configs` 자동생성이라 새 모듈이 설정 누락돼도 깨지지 않음 (숨김으로 들어옴).

---

## 6. 결정 사항 (P0 합의 완료)

1. **표시/순서/라벨/단위 소유** → ✅ **DB 설정(B안)**. admin에서 개발/배포 없이 조정. (서버 name 은 자동생성 시 초기 라벨로만)
2. **설정 범위** → ✅ **전역** (제품 공통, user_id 없음)
3. **새 모듈 등장 시** → ✅ **자동 생성** (`display:false`, label=서버 name) → admin이 켬
4. **admin 편집** → ✅ **숫자 정렬 우선** (드래그 정렬은 추후)
5. **수정 범위(P3)** → grade + value 둘 다 (오버레이)
6. **안 쓰는 9개 모듈** → 시드에서 `display:false`
7. **상중하 비율**(소스 없음) → 당장 수동 입력 유지 (서버 신규 모듈은 추후)

---

## 7. 안 건드릴 것 (못박기)
- 모듈 **번호 재배열 금지**.
- `face_analysis_results` **스키마 변경 불필요**.
- **파이썬 분석 응답 스펙 변경 없음** (표시 메타는 DB로 분리). 새 DB는 `module_configs` 만.
