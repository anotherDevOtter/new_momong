import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_USER_EMAIL || '';
const PASSWORD = process.env.TEST_USER_PASSWORD || '';

test.describe('유저 로그인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('로그인 페이지가 정상 렌더링된다', async ({ page }) => {
    await expect(page).toHaveTitle(/FIT|Merci|Momong/i);
    await expect(page.getByText('FIT 헤어컨설팅')).toBeVisible();
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('비밀번호를 입력하세요')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });

  test('이메일과 비밀번호가 비어 있으면 제출이 막힌다', async ({ page }) => {
    await page.getByRole('button', { name: '로그인' }).click();
    // HTML5 required 속성으로 브라우저가 막음 — URL 변화 없음
    await expect(page).toHaveURL('/login');
  });

  test('잘못된 이메일/비밀번호로 로그인하면 에러 메시지가 표시된다', async ({ page }) => {
    test.setTimeout(60000);

    await page.getByPlaceholder('example@email.com').fill('wrong@example.com');
    await page.getByPlaceholder('비밀번호를 입력하세요').fill('wrongpassword');
    await page.getByRole('button', { name: '로그인' }).click();

    // API 응답 대기 (로딩 버튼이 사라질 때까지, 최대 50초)
    await expect(page.getByRole('button', { name: '로그인 중...' })).not.toBeVisible({ timeout: 50000 });
    await expect(page.locator('p.text-red-500')).toBeVisible({ timeout: 5000 });
  });

  test('올바른 계정으로 로그인하면 메인 페이지로 이동한다', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'TEST_USER_EMAIL / TEST_USER_PASSWORD 환경변수 필요');

    await page.getByPlaceholder('example@email.com').fill(EMAIL);
    await page.getByPlaceholder('비밀번호를 입력하세요').fill(PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).not.toHaveURL('/login', { timeout: 10000 });
  });

  test('로그인 성공 후 localStorage에 auth_token이 저장된다', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'TEST_USER_EMAIL / TEST_USER_PASSWORD 환경변수 필요');

    await page.getByPlaceholder('example@email.com').fill(EMAIL);
    await page.getByPlaceholder('비밀번호를 입력하세요').fill(PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).not.toHaveURL('/login', { timeout: 10000 });

    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });

  test('아이디 찾기 / 비밀번호 재설정 / 회원가입 링크가 존재한다', async ({ page }) => {
    await expect(page.getByRole('link', { name: '아이디 찾기' })).toBeVisible();
    await expect(page.getByRole('link', { name: '비밀번호 재설정' })).toBeVisible();
    await expect(page.getByRole('link', { name: '회원가입' })).toBeVisible();
  });
});
