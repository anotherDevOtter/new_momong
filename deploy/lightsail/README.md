# 인프라 전환 런북 — EB · RDS → Lightsail (prod)

> 계획 · 배경: [INFRA-MIGRATION.md](../../INFRA-MIGRATION.md) (§7 Lightsail, §10 이름 정리)
> 매장은 전환 동안 쓰지 않는다 (2026-10-11 확인). 그래서 쓰기 차단 · 데이터 재동기화 없이 순서대로 진행한다.
>
> 표시: 🧑 = 사용자(콘솔 · 맥) · 🖥 = 서버(SSH 접속해서) · ✅ = 확인할 것

| 새 자원 | 이름 |
|---|---|
| Lightsail 인스턴스 | `momong-prod-api` (Ubuntu 24.04, 1GB, 서울) + 고정 IP `momong-prod-ip` |
| Lightsail 관리형 DB | `momong-prod-db` (PostgreSQL 18, 서울, 공개 모드 끔) — DB 이름 `momong_prod` |
| S3 버킷 | `momong-prod` |
| IAM 사용자 | `momong-prod-s3` (`momong-prod` 버킷만) |

---

## A. 준비 (전환 전날까지, 운영 영향 없음)

### A-1 🧑 S3 버킷 `momong-prod`

1. S3 → 버킷 만들기: 이름 `momong-prod`, 리전 서울, **퍼블릭 액세스 모두 차단**(기본값).
2. 예전 버킷 `momong-staging` 의 CORS 를 바탕으로 **localhost 를 뺀** CORS 를 `momong-prod` 에 넣는다 (로컬은 `momong-dev` 버킷을 쓴다):
   ```json
   [{ "AllowedHeaders": ["*"], "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
      "AllowedOrigins": ["https://*.merci-momong.com"],
      "ExposeHeaders": ["ETag", "x-amz-version-id"], "MaxAgeSeconds": 3000 }]
   ```
   버킷 만들 때 **버킷 네임스페이스는 글로벌**(기본값). 계정 리전 네임스페이스는 주소 형식이 달라질 수 있다.
3. 예전 버킷 → 관리 → 수명 주기 규칙 — 2026-10-11 확인: 없음.

### A-2 🧑 IAM 사용자 `momong-prod-s3`

IAM → 사용자 만들기 `momong-prod-s3` (콘솔 접근 없음) → 인라인 정책:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"], "Resource": "arn:aws:s3:::momong-prod/*" },
    { "Effect": "Allow", "Action": ["s3:ListBucket"], "Resource": "arn:aws:s3:::momong-prod" }
  ]
}
```

→ 액세스 키 만들기 → 키 · 비밀값을 **맥 메모(EB 환경 변수 옆)** 에 적어 둔다. (A-5 에서 넣는다)

### A-3 🧑 Lightsail DB `momong-prod-db` — 먼저 만든다 (생성에 10~20분)

1. https://lightsail.aws.amazon.com → **데이터베이스** 탭 → **데이터베이스 생성**
2. 위치: 서울 `ap-northeast-2`, 가용 영역 기본(a)
3. 데이터베이스: **PostgreSQL 18.x** (18 중 최신. 17 도 된다 — 운영 덤프는 17.9. 18 은 지원 기간이 1년 더 길다. A-7 리허설로 확인)
4. 로그인 자격 증명: 사용자 이름 기본 `dbmasteruser`, 비밀번호는 "강력한 암호 생성" 그대로 (만든 뒤 볼 수 있다)
5. 마스터 데이터베이스 이름: **기본값 그대로** (`momong_prod` 는 C-2 에서 만든다)
6. 플랜: **표준** 가장 작은 것 (1GB). 고가용성 없음
7. 이름 `momong-prod-db` → 생성 → "사용 가능" 까지 대기
8. **연결 세부 정보**의 엔드포인트 · 사용자 이름 · 비밀번호를 메모에 적는다
9. 네트워킹 탭: **퍼블릭 모드 꺼짐** 확인 (기본값)

### A-4 🧑 Lightsail 인스턴스 `momong-prod-api` — DB 를 기다리는 동안

1. **인스턴스** 탭 → **인스턴스 생성**
2. 위치: 서울, 가용 영역 **DB 와 같은 a**
3. 플랫폼 Linux/Unix → **OS 전용** → **Ubuntu 24.04 LTS**
4. SSH 키: 서울 기본 키 그대로
5. 네트워킹 유형: **듀얼 스택** (IPv6 전용 X — 고정 IPv4 필요)
6. 플랜: 듀얼 스택 **1GB RAM**
7. 이름 `momong-prod-api` → 생성
8. 인스턴스 → **네트워킹** 탭
   - **고정 IP 생성** → 이 인스턴스에 연결, 이름 `momong-prod-ip` → IP 를 메모에
   - **IPv4 방화벽** → 규칙 추가 **HTTPS 443** (HTTP 80 · SSH 22 는 이미 있다. GitHub 배포가 SSH 로 들어오므로 22 는 모두 허용 그대로, 키로만 접속된다)
9. 오른쪽 위 **계정 → SSH 키** → 서울 **기본 키 다운로드** (`LightsailDefaultKey-ap-northeast-2.pem`)

### A-5 🖥 서버 첫 세팅

맥에서 (저장소 `new_momong` 폴더):
```bash
chmod 600 ~/Downloads/LightsailDefaultKey-ap-northeast-2.pem
scp -i ~/Downloads/LightsailDefaultKey-ap-northeast-2.pem deploy/lightsail/setup-server.sh deploy/lightsail/.env.prod.example ubuntu@<고정IP>:~
ssh -i ~/Downloads/LightsailDefaultKey-ap-northeast-2.pem ubuntu@<고정IP>
```
서버에서:
```bash
bash setup-server.sh            # Docker · psql 18 · 스왑 · ~/momong
exit                            # Docker 권한 적용을 위해 다시 접속
```
다시 접속한 뒤 **환경 변수 넣기 ← 메모의 값은 여기서 넣는다**:
```bash
cp ~/.env.prod.example ~/momong/.env.prod
nano ~/momong/.env.prod         # 파일 안 [EB] = EB 메모 값, [새] = A-2 · A-3 에서 적은 값
chmod 600 ~/momong/.env.prod
```
✅ `grep -c '=$' ~/momong/.env.prod` 로 빈 값 개수를 본다. `AWS_PRESIGNED_EXPIRES_IN` 등 비워도 되는 것만 남아야 한다.

### A-6 🧑 GitHub Secrets

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret:
`LIGHTSAIL_HOST`(고정 IP) · `LIGHTSAIL_USER`(`ubuntu`) · `LIGHTSAIL_SSH_KEY`(.pem 파일 내용 전체)

### A-7 🖥 리허설 (권장) — 2026-10-10 덤프로 복원해 보기

C-2 · C-3 을 지금 있는 덤프로 한 번 해 본다. **17 → 18 복원이 오류 없이 되는지**, 확장 `uuid-ossp` 가 되는지, 시간이 얼마나 걸리는지 본다. 끝나면:
```bash
psql "host=$DB_HOST user=$DB_USERNAME dbname=postgres sslmode=require" -c "DROP DATABASE momong_prod;"
```

---

## B. 전환 당일

| # | 누가 | 할 일 | ✅ |
|---|---|---|---|
| B-1 | 🧑 | 매장이 쓰지 않는 것 확인 (EB 는 켜 둔다 — DNS 를 바꾸기 전까지 되돌릴 곳) | |
| B-2 | 🧑 | **최종 덤프** (아래 C-1) | 파일 수 MB |
| B-3 | 🧑 | **사진 복사** (아래 C-4) | 개수 같음 |
| B-4 | 🖥 | **DB 복원 · 키 변환 · 주소 변경** (C-2 · C-3) | 행 수 = 덤프 |
| B-5 | 🧑🖥 | **백엔드 첫 배포** — 서버에서 직접 빌드 (아래 C-5). GitHub 자동 배포는 워크플로가 `main` 에 들어간 뒤(B-7)부터 동작한다 | `API OK` |
| B-6 | 🧑 | **DNS 전환** — Route 53 → `manager-api.merci-momong.com` 레코드를 **A 레코드 · 고정 IP** 로 | `curl -I https://manager-api.merci-momong.com` 200/404 (인증서 오류 없음) |
| B-7 | 🧑 | **프론트 배포** — `feat/face-measure-web` 을 `main` 에 merge → Amplify 가 user · admin 자동 배포 (백엔드 워크플로도 Lightsail 로 다시 한 번 돈다) | Amplify 빌드 성공 |
| B-8 | 🧑 | **운영 확인** — 로그인 → 촬영 → 이목구비 → 저장 → 리포트 → 공유 링크, admin 로그인 · 얼굴 분석 테스트, **예전 고객 사진 · 사전설문 사진이 열리는지** | 전부 정상 |
| B-9 | 🧑 | 매장에 사용 재개 안내 | |

### 되돌리기

- **B-6 전**: 아무것도 바뀌지 않았다. 새 자원만 지우면 끝.
- **B-6 후**: Route 53 레코드를 원래 값(EB)으로 되돌린다. EB · RDS · 옛 버킷은 그대로 있다.
  B-7 merge 까지 했다면 `main` 을 이전 커밋으로 되돌려 Amplify 를 예전 화면으로 (백엔드는 EB 가 옛 코드 그대로).

---

## C. 명령어

### C-1 🧑 최종 덤프 (맥)

DataGrip 이 아니라 터미널로, 소유자 · 권한 정보를 빼고 받는다 (다른 사용자로 복원해야 해서):
```bash
/opt/homebrew/opt/postgresql@17/bin/pg_dump \
  -h <RDS 엔드포인트 momong-staging.….rds.amazonaws.com> -U <RDS 사용자> -d fit_hair \
  --no-owner --no-privileges -f ~/momong_prod_$(date +%Y%m%d_%H%M).sql
scp -i <pem> ~/momong_prod_*.sql backend/migrations/005_face_measure_keys.sql backend/migrations/006_s3_bucket_rename.sql ubuntu@<고정IP>:~/momong/
```
✅ 파일 크기 수 MB, `grep -c '^COPY public' 파일` = 13

### C-2 🖥 DB 복원 (서버)

```bash
cd ~/momong && set -a && . ./.env.prod && set +a
export PGPASSWORD="$DB_PASSWORD"
PG="host=$DB_HOST user=$DB_USERNAME sslmode=require"
psql "$PG dbname=postgres" -c "CREATE DATABASE momong_prod;"
psql "$PG dbname=momong_prod" -v ON_ERROR_STOP=1 -f momong_prod_*.sql > restore.log
```
✅ 행 수 (덤프와 같아야 한다 — 2026-10-10 기준 고객 485 · 상담 379 · 분석 180 · 사전설문 175 · 공유 304):
```bash
psql "$PG dbname=momong_prod" -c "SELECT 'customers', count(*) FROM customers UNION ALL SELECT 'consultations', count(*) FROM consultations UNION ALL SELECT 'face_analysis_results', count(*) FROM face_analysis_results UNION ALL SELECT 'pre_surveys', count(*) FROM pre_surveys UNION ALL SELECT 'consultation_shares', count(*) FROM consultation_shares;"
```

### C-3 🖥 키 변환 · 사진 주소 변경 (서버)

```bash
psql "$PG dbname=momong_prod" -f 005_face_measure_keys.sql
psql "$PG dbname=momong_prod" -v old_bucket=momong-staging -v new_bucket=momong-prod -f 006_s3_bucket_rename.sql
```
✅ `UPDATE 180` 근처 숫자들이 나오고 오류가 없을 것. 옛 버킷 주소가 남으면 006 이 스스로 실패한다.

### C-4 🧑 사진 복사 (AWS 콘솔 → CloudShell)

콘솔 오른쪽 위 CloudShell 아이콘 (맥에 AWS 키가 없어도 된다):
```bash
aws s3 sync s3://momong-staging s3://momong-prod --exclude "elasticbeanstalk-artifacts/*"
aws s3 ls s3://momong-staging --recursive --summarize | tail -2
aws s3 ls s3://momong-prod --recursive --summarize | tail -2
```
✅ 두 버킷의 개수 · 크기 차이가 `elasticbeanstalk-artifacts/` 만큼뿐

### C-5 🧑🖥 백엔드 첫 배포 — 서버에서 빌드 (맥 → 서버)

맥에서 (저장소 `new_momong` 폴더, 브랜치 `feat/face-measure-web`):
```bash
tar --exclude=node_modules --exclude=dist -czf /tmp/backend.tgz backend
scp -i <pem> /tmp/backend.tgz deploy/lightsail/docker-compose.yml deploy/lightsail/Caddyfile ubuntu@<고정IP>:~/momong/
```
서버에서:
```bash
cd ~/momong && rm -rf backend && tar xzf backend.tgz && rm backend.tgz
docker build -t momong-api:latest backend      # 1GB 서버라 몇 분 걸린다 (스왑 사용)
docker compose up -d
curl -fsS http://127.0.0.1:3200/api/module-configs > /dev/null && echo "API OK"
```
이때는 DNS 가 아직 EB 를 가리켜 Caddy 인증서 발급이 실패한다 — 정상. B-6 뒤에 자동으로 받는다.

### 서버 관리 (전환 후)

```bash
cd ~/momong
docker compose ps                  # 상태
docker compose logs -f --tail=100 api   # 로그
docker compose restart api         # 재시작
```

---

## D. 정리 (1주 관찰 후)

- EB 환경 2개 종료: `Momong-staging-env` · `momong-face-analyze-staging-env` (로드밸런서 · EC2 · IP 같이 사라짐)
- RDS `momong-staging`: **최종 스냅샷** 만들고 삭제 (안의 예전 DB `momong-staging` · `momong-dev` 도 같이. 덤프 · CSV 는 `momong-database/migration-backup/`)
- S3 `momong-staging`: 한 달 정도 둔 뒤 삭제
- S3 `elasticbeanstalk-ap-northeast-2-…`: EB 가 만든 배포 · 로그 버킷. EB 종료 뒤 삭제 (사진 없음)
- `face_landmark` 저장소 배포 워크플로 끄기
- Amplify 앱 이름 → `momong-prod-user` · `momong-prod-admin` (선택)
- `test` 코스 · 비교 화면 삭제 후 배포 (INFRA-MIGRATION C5)
- 다음 달 청구서로 절감 확인
- (참고) 운영 DB 를 맥에서 백업하려면 `pg_dump` 18 필요: `brew install postgresql@18`
