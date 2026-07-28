import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/#today');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('menu é navegável por teclado e devolve o foco ao fechar', async ({ page }) => {
  const menu = page.getByRole('button', { name: 'Abrir menu' });
  await menu.click();
  const sidebar = page.getByLabel('Menu principal');
  await expect(sidebar).toHaveAttribute('aria-hidden', 'false');
  await expect(page.getByRole('button', { name: 'Dia atual' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  await expect(menu).toBeFocused();
});

test('calendário e telas principais não introduzem violações críticas', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#month');
  await expect(page.locator('#app h2', { hasText: 'Mês' })).toBeVisible();
  expect(errors).toEqual([]);
  await expect(page.locator('.calendar-day').first()).toBeVisible();
  const results = await new AxeBuilder({ page }).include('#app').analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact))).toEqual([]);
});

for (const width of [320, 360, 375, 390, 412, 430, 480, 768, 1024, 1440]) {
  test(`não há rolagem horizontal em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 820 : 900 });
    await page.goto('/#month');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('service worker é registrado em ambiente local seguro', async ({ page }) => {
  await page.goto('/#today');
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker?.getRegistration().then(Boolean))).toBe(true);
});
