

# Browser Fingerprint Tester

A lightweight browser fingerprint testing framework built for research and analysis.
It uses pure JavaScript to collect client-side data, which you can then analyze server-side with your own tools.

The framework gathers a wide range of signals (Canvas, WebGL, ClientRects, Fonts, Headers, etc.).

> **Live Demo**: [See your browser fingerprint now](https://fptest.yemel.org)


### Use Cases
- Detect automation tools (Playwright, Selenium)
- Differentiate between real browsers and bots
- Explore unique browser/hardware features for research


> If you're looking for more advanced solution, check out [CreepJS](https://github.com/abrahamjuliot/creepjs)


## Features

No Node.js or external tooling required - just plug and go.

Modular JS collectors for:
 - Canvas & 2D rendering
 - WebGL (with extended GPU info)
 - ClientRects geometry tests
 - Fonts, plugins, navigator & screen info
 - Headers & Client Hints

Stable hashing of collected data:
 - General fingerprint hash
 - GPU-onpy hash (WebGL/WebGPU vendor/renderer/adapter)


## Quick Start

1. Fetch repo
```bash
git clone https://github.com/yemelgen/fptest.git
```

2. Install dependencies
```bash
pip install -r requirements.txt
```

3. Run the server
```bash
python main.py
```

4. User collectors in your page
```html
<script src="/collectors/canvas.js"></script>
<script src="/collectors/webgl.js"></script>
<script>
(async () => {
  const data = {
    canvas: collectCanvas(),
    webgl: collectWebGL(),
    clientRects: runRectTests(),
  };

  await fetch("/fingerprint/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
})();
</script>
```

## Testing with Playwright

You can use Playwright to run headless browser tests against fptest. The page writes its raw JSON output to a hidden `#raw-output` element once all collectors finish.

```bash
pip install playwright
playwright install chromium
```

```python
import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8008/fptest")

    # Wait for collectors to finish and results to appear
    page.wait_for_selector("#results:not(.hidden)", timeout=30000)
    raw = page.inner_text("#raw-output")
    data = json.loads(raw)

    print(json.dumps(data["metadata"]["scoring"], indent=2))
    browser.close()
```

Async version:

```python
import asyncio, json
from playwright.async_api import async_playwright

async def collect(headless=True):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        page = await browser.new_page()
        await page.goto("http://localhost:8008")
        await page.wait_for_selector("#results:not(.hidden)", timeout=30000)
        raw = await page.inner_text("#raw-output")
        await browser.close()
        return json.loads(raw)

result = asyncio.run(collect())
print(result["metadata"]["visitor_id"])
```

Test across browsers:

```python
for browser_type in [p.chromium, p.firefox, p.webkit]:
    browser = browser_type.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8008")
    page.wait_for_selector("#results:not(.hidden)", timeout=30000)
    data = json.loads(page.inner_text("#raw-output"))
    score = data["metadata"]["scoring"]["authenticity_score"]
    engine = data["metadata"]["detection"]["engine"]["engine"]
    print(f"{browser_type.name}: engine={engine}, score={score}")
    browser.close()
```

## Disclaimer

This project is intended for educational and research purposes only.
It should not be used for malicious tracking or privacy-invasive practices.

## License
MIT License
