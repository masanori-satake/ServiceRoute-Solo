import os
import sys
import time
import json

def generate_store_assets():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    app_dir = os.path.join(root_dir, "projects/app")
    output_dir = os.path.join(app_dir, "assets/store/screenshots")

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Error: playwright not found.")
        return False

    with sync_playwright() as p:
        # Launch browser with the extension loaded
        browser = p.chromium.launch(headless=True)

        # Note: In headless mode, we can't easily test the actual extension popup/options as an extension.
        # But we can render the HTML files directly to get high-quality screenshots of the UI.

        pages_to_screenshot = [
            {"name": "popup", "path": "popup/popup.html", "width": 400, "height": 600},
            {"name": "options", "path": "options/options.html", "width": 800, "height": 600},
        ]

        for item in pages_to_screenshot:
            page = browser.new_page(viewport={"width": item["width"], "height": item["height"]})
            file_url = f"file://{os.path.abspath(os.path.join(app_dir, item['path']))}"

            # We need to mock some chrome extension APIs if they are used on load
            # For simplicity, we just load and see.
            # In a real scenario, we might need a more sophisticated mock.
            page.goto(file_url)

            # Inject mock for chrome.i18n and chrome.storage if needed
            page.evaluate("""
                window.chrome = window.chrome || {};
                window.chrome.storage = window.chrome.storage || {
                    local: {
                        get: (keys, cb) => cb({
                            services: [
                                { name: 'Example Service', url: 'https://example.com', status: 'normal', lastCheck: Date.now() },
                                { name: 'Issue Service', url: 'https://buggy.com', status: 'error', lastCheck: Date.now(), failureSince: Date.now() - 600000 }
                            ],
                            businessHours: { start: '00:00', end: '00:00', weekendsOff: false }
                        }),
                        onChanged: { addListener: () => {} }
                    }
                };
                window.chrome.i18n = window.chrome.i18n || {
                    getMessage: (key) => key
                };
                window.chrome.runtime = window.chrome.runtime || {
                    getManifest: () => ({ version: '0.3.9' }),
                    sendMessage: () => {},
                    onMessage: { addListener: () => {} }
                };
            """)

            # Reload to apply mocks if necessary, or just wait
            page.reload()
            time.sleep(1)

            out_path = os.path.join(output_dir, f"{item['name']}.png")
            page.screenshot(path=out_path)
            print(f"Generated {out_path}")

        browser.close()
    return True

if __name__ == "__main__":
    if not generate_store_assets():
        sys.exit(1)
