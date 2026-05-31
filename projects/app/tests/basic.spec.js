const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Background Script Initialization', () => {
  test('should verify extension files', async () => {
    const manifestPath = path.join(__dirname, '../manifest.json');
    const backgroundPath = path.join(__dirname, '../background.js');

    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(fs.existsSync(backgroundPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.name).toBe('ServiceRoute-Solo');
  });

  test('versions should match between manifest and package.json', async () => {
    const manifestPath = path.join(__dirname, '../manifest.json');
    const packagePath = path.join(__dirname, '../../../package.json');

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    expect(manifest.version).toBe(pkg.version);
  });

  test('background script should contain fixed listeners', async () => {
    const backgroundPath = path.join(__dirname, '../background.js');
    const content = fs.readFileSync(backgroundPath, 'utf8');

    expect(content).toContain('chrome.idle.setDetectionInterval(300)');
    expect(content).toContain('chrome.runtime.onInstalled.addListener(async ()');
    expect(content).toContain('chrome.runtime.onStartup.addListener(async ()');
    expect(content).toContain('chrome.idle.onStateChanged.addListener(async (newState)');
    expect(content).toContain('await dispatchChecks()');
  });
});
