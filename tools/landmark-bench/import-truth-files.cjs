// 예전 정답 파일(landmark-bench/truth/<사진>.json) → DB face_landmark_truths (migrations/008). 로컬 전용, 한 번만 쓰면 된다.
//   photo = 'local:<사진 이름>'. 이미 DB 에 있는 사진은 건너뛴다 (덮어쓰지 않음). 파일은 지우지 않는다.
// 사용 (new_momong/backend 에서, 로컬 .env 의 DB 로):
//   node ../tools/landmark-bench/import-truth-files.cjs [정답 폴더 = ../../landmark-bench/truth]
const fs = require('fs');
const path = require('path');
// 패키지는 backend 의 node_modules 에서 (이 파일은 tools/ 에 있다)
const backendRequire = require('module').createRequire(path.join(process.cwd(), 'package.json'));
backendRequire('dotenv').config();
const { Client } = backendRequire('pg');

const dir = path.resolve(process.argv[2] || path.join(process.cwd(), '..', '..', 'landmark-bench', 'truth'));
if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1'].includes(process.env.DB_HOST)) {
  console.error('로컬 DB(.env DB_HOST=localhost)에서만 돌린다');
  process.exit(1);
}

(async () => {
  const db = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  await db.connect();
  let added = 0;
  let skipped = 0;
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    const t = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const name = f.replace(/\.json$/, '');
    const r = await db.query(
      `INSERT INTO face_landmark_truths (photo, image_width, image_height, points, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, 'import-truth-files', $5)
       ON CONFLICT (photo) DO NOTHING`,
      [`local:${name}`, t.imageWidth, t.imageHeight, JSON.stringify(t.points), t.updatedAt],
    );
    r.rowCount ? added++ : skipped++;
    console.log(`${r.rowCount ? '넣음' : '이미 있음'}  ${name}  점 ${Object.keys(t.points).length}개`);
  }
  await db.end();
  console.log(`끝: 넣음 ${added} · 건너뜀 ${skipped}  (${dir})`);
})().catch((e) => {
  console.error('멈춤:', e.message);
  process.exit(1);
});
