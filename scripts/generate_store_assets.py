import os
import sys
import time
import json

def generate_store_assets():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    app_dir = os.path.join(root_dir, "projects/app")
    output_dir = os.path.join(app_dir, "assets/store/screenshots")
    manifest_path = os.path.join(app_dir, "manifest.json")

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    version = "1.0.0"
    try:
        if os.path.exists(manifest_path):
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)
                version = manifest_data.get("version", version)
    except Exception as e:
        print(f"Warning: Could not read version from manifest: {e}")

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Error: playwright not found.")
        return False

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)

        pages_to_screenshot = [
            {"name": "popup", "path": "popup/popup.html", "width": 400, "height": 600},
            {"name": "options", "path": "options/options.html", "width": 800, "height": 600},
        ]

        for item in pages_to_screenshot:
            page = browser.new_page(viewport={"width": item["width"], "height": item["height"]})
            file_url = f"file://{os.path.abspath(os.path.join(app_dir, item['path']))}"

            # Inject mock for chrome.i18n and chrome.storage before loading the page
            page.add_init_script("""
                window.chrome = window.chrome || {};
                window.chrome.storage = window.chrome.storage || {
                    local: {
                        get: (keys, cb) => {
                            const data = {
                                services: [
                                    { name: 'Example Service', url: 'https://example.com', status: '🟢', lastCheck: Date.now() },
                                    { name: 'Issue Service', url: 'https://buggy.com', status: '❌', lastCheck: Date.now(), failureSince: Date.now() - 600000 }
                                ],
                                businessHours: { start: '00:00', end: '00:00', weekendsOff: false }
                            };
                            if (cb) cb(data);
                            return Promise.resolve(data);
                        },
                        onChanged: { addListener: () => {} }
                    }
                };
                window.chrome.i18n = window.chrome.i18n || {
                    getMessage: (key) => key
                };
                window.chrome.runtime = window.chrome.runtime || {
                    getManifest: () => ({ version: '""" + version + """' }),
                    sendMessage: () => {},
                    onMessage: { addListener: () => {} }
                };
            """)

            page.goto(file_url)
            # Brief wait for rendering
            time.sleep(1)

            out_path = os.path.join(output_dir, f"{item['name']}.png")
            page.screenshot(path=out_path)
            print(f"Generated {out_path}")

        browser.close()
    return True

if __name__ == "__main__":
    if not generate_store_assets():
        sys.exit(1)
