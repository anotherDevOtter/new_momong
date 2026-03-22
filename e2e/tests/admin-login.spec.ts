import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_ADMIN_EMAIL || '';
const PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';

test.describe('어드민 로그인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('로그인 페이지가 정상 렌더링된다', async ({ page }) => {
    await expect(page.getByText('MERCI MOMONG')).toBeVisible();
    await expect(page.getByText('어드민')).toBeVisible();
    await expect(page.getByPlaceholder('이메일')).toBeVisible();
    await expect(page.getByPlaceholder('비밀번호')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });

  test('이메일과 비밀번호가 비어 있으면 제출이 막힌다', async ({ page }) => {
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('잘못된 이메일/비밀번호로 로그인하면 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('이메일').fill('wrong@example.com');
    await page.getByPlaceholder('비밀번호').fill('wrongpassword');
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(
      page.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')
    ).toBeVisible({ timeout: 10000 });
  });

  test('올바른 계정으로 로그인하면 대시보드로 이동한다', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD 환경변수 필요');

    await page.getByPlaceholder('이메일').fill(EMAIL);
    await page.getByPlaceholder('비밀번호').fill(PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('로그인 성공 후 admin_token 쿠키가 설정된다', async ({ page, context }) => {
    test.skip(!EMAIL || !PASSWORD, 'TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD 환경변수 필요');

    await page.getByPlaceholder('이메일').fill(EMAIL);
    await page.getByPlaceholder('비밀번호').fill(PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    const cookies = await context.cookies();
    const adminToken = cookies.find((c) => c.name === 'admin_token');
    expect(adminToken).toBeTruthy();
    expect(adminToken?.value).toBeTruthy();
  });

  test('로그인한 상태에서 /login 접근 시 /dashboard로 리다이렉트된다', async ({ page, context }) => {
    test.skip(!EMAIL || !PASSWORD, 'TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD 환경변수 필요');

    // 먼저 로그인
    await page.getByPlaceholder('이메일').fill(EMAIL);
    await page.getByPlaceholder('비밀번호').fill(PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // 다시 /login 접근
    await page.goto('/login');
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });
});
