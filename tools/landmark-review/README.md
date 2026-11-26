# 로컬에서 운영 사진으로 랜드마크 검수하기

운영에는 아무것도 쓰지 않는다. 운영에서 가져오는 건 **사진 목록(주소 · 출처 · 시각)** 과
**사진 파일 읽기**뿐이고, 가/부 검수 결과는 로컬 DB(`face_landmark_reviews`)에만 남는다.

```
운영 DB ──(읽기 전용 SELECT, 사용자가 실행)──▶ prod-photos.csv ──▶ 로컬 DB landmark_review_photos
운영 S3 ──(읽기 전용 키, 로컬 백엔드가 받아 넘김)──▶ 로컬 admin /landmark-review
```

## 1. 🧑 사진 목록 받기 (운영 서버)

```bash
scp -i ~/Downloads/LightsailDefaultKey-ap-northeast-2.pem \
  tools/landmark-review/export-prod-photos.sh ubuntu@<고정IP>:~/
ssh -i ~/Downloads/LightsailDefaultKey-ap-northeast-2.pem ubuntu@<고정IP> \
  'bash ~/export-prod-photos.sh > ~/prod-photos.csv && wc -l ~/prod-photos.csv'
scp -i ~/Downloads/LightsailDefaultKey-ap-northeast-2.pem \
  ubuntu@<고정IP>:~/prod-photos.csv ~/Downloads/
ssh -i ~/Downloads/LightsailDefaultKey-ap-northeast-2.pem ubuntu@<고정IP> 'rm ~/prod-photos.csv ~/export-prod-photos.sh'
```

DB 연결을 `default_transaction_read_only=on` 으로 열어서 SELECT 외에는 실행되지 않는다.

## 2. 🧑 사진 읽기 전용 S3 키 만들기 (AWS 콘솔)

IAM → 사용자 만들기(예: `momong-landmark-review-local`) → 인라인 정책:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::momong-prod/face-analysis/*"
  }]
}
```

액세스 키를 만들어 `backend/.env` 에 넣는다 (Git 에 안 들어가는 파일):

```
LANDMARK_REVIEW_PHOTOS=import
LANDMARK_REVIEW_S3_BUCKET=momong-prod
LANDMARK_REVIEW_AWS_ACCESS_KEY_ID=...
LANDMARK_REVIEW_AWS_SECRET_ACCESS_KEY=...
```

검수가 끝나면 이 네 줄을 지우고 IAM 키를 비활성화 · 삭제한다.

## 3. 로컬에 넣고 보기

```bash
bash tools/landmark-review/import-photos.sh ~/Downloads/prod-photos.csv
# 백엔드 재시작 → http://localhost:3203/landmark-review
```

- `LANDMARK_REVIEW_PHOTOS=import` 는 `NODE_ENV=production` 이면 백엔드가 뜨지 않게 막혀 있다.
- 이 모드에서는 화면이 `landmark_review_photos` 목록만 보여 준다. 끄면(줄 삭제) 로컬 분석 기록으로 돌아간다.
- 사진은 브라우저가 S3 를 직접 부르지 않고 백엔드(`GET …/landmark-review/photo`)를 거친다.
  운영 버킷 CORS 에 localhost 를 넣지 않아도 된다.
