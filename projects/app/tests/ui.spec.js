import { test, expect } from '@playwright/test';
import path from 'path';

test('Options page basic elements exist', async ({ page }) => {
  const optionsPath = `file://${path.resolve('projects/app/options/options.html')}`;
  await page.goto(optionsPath);

  await expect(page.locator('h1')).toHaveText('ServiceRoute-Solo 設定');
  await expect(page.locator('#export-btn')).toBeVisible();
  await expect(page.locator('#import-btn')).toBeVisible();
  await expect(page.locator('h2:has-text("監視時間設定")')).toBeVisible();
});

test('Popup page basic elements exist', async ({ page }) => {
  const popupPath = `file://${path.resolve('projects/app/popup/popup.html')}`;
  await page.goto(popupPath);

  await expect(page.locator('h1')).toHaveText('サービス状況');
  await expect(page.locator('#open-settings')).toBeVisible();
});
