// SQL 파일 하나를 DB 에 실행한다. 운영에서는 api 컨테이너 안에서 돌아간다 (apply-migration.sh 가 표준입력으로 넘긴다).
//   DB 접속 정보는 그 환경(.env.prod)의 DB_* 를 그대로 쓴다 — 키를 따로 받지 않는다.
//   SQL 은 SQL_B64 (base64) 로 받는다. 한 트랜잭션으로 실행하고, 하나라도 실패하면 전부 되돌린다.
//   CHECK_B64 (선택, base64 SELECT) 가 있으면 끝난 뒤 그 결과를 보여 준다.
const { Client } = require('pg');

(async () => {
  const sql = Buffer.from(process.env.SQL_B64 || '', 'base64').toString('utf8');
  if (!sql.trim()) throw new Error('SQL_B64 가 비었다');
  const db = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    // 앱(app.module)과 같은 규칙: development 만 SSL 없이
    ssl: process.env.NODE_ENV === 'development' ? false : { rejectUnauthorized: false },
  });
  await db.connect();
  console.error(`DB ${process.env.DB_DATABASE} 에 실행`);
  try {
    await db.query('BEGIN');
    await db.query(sql);
    await db.query('COMMIT');
  } catch (e) {
    await db.query('ROLLBACK').catch(() => {});
    throw e;
  }
  console.error('적용 완료');
  const check = Buffer.from(process.env.CHECK_B64 || '', 'base64').toString('utf8');
  if (check.trim()) {
    const { rows } = await db.query(check);
    console.error('확인:', JSON.stringify(rows));
  }
  await db.end();
})().catch((e) => {
  console.error('실패 (아무것도 바뀌지 않음):', e.message);
  process.exit(1);
});
