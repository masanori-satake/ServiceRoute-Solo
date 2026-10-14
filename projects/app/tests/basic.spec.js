const { test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

test.describe("Background Script Initialization", () => {
  test("should verify extension files", async () => {
    const manifestPath = path.join(__dirname, "../manifest.json");
    const backgroundPath = path.join(__dirname, "../background.js");

    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(fs.existsSync(backgroundPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    expect(manifest.name).toContain("ServiceRoute-Solo");
    expect(manifest.short_name).toBe("__MSG_short_name__");
    expect(manifest.default_locale).toBe("en");
  });

  test("should verify locale message files", async () => {
    const enLocalePath = path.join(__dirname, "../_locales/en/messages.json");
    const jaLocalePath = path.join(__dirname, "../_locales/ja/messages.json");

    expect(fs.existsSync(enLocalePath)).toBe(true);
    expect(fs.existsSync(jaLocalePath)).toBe(true);

    const enMessages = JSON.parse(fs.readFileSync(enLocalePath, "utf8"));
    const jaMessages = JSON.parse(fs.readFileSync(jaLocalePath, "utf8"));

    expect(enMessages.short_name.message).toBe("ServiceRoute");
    expect(jaMessages.short_name.message).toBe("ServiceRoute");
  });

  test("versions should match between manifest and package.json", async () => {
    const manifestPath = path.join(__dirname, "../manifest.json");
    const packagePath = path.join(__dirname, "../../../package.json");

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    expect(manifest.version).toBe(pkg.version);
  });

  test("background script should contain fixed listeners", async () => {
    const backgroundPath = path.join(__dirname, "../background.js");
    const content = fs.readFileSync(backgroundPath, "utf8");

    expect(content).toContain("chrome.idle.setDetectionInterval(300)");
    expect(content).toContain(
      "chrome.runtime.onInstalled.addListener(async ()",
    );
    expect(content).toContain("chrome.runtime.onStartup.addListener(async ()");
    expect(content).toContain(
      "chrome.idle.onStateChanged.addListener(async (newState)",
    );
    expect(content).toContain("await dispatchChecks()");
  });
});
