

# Browser Fingerprint Tester

A lightweight browser fingerprint testing framework built for research and analysis.  
It uses pure JavaScript to collect client-side data, which you can then analyze server-side with your own tools.  

The framework gathers a wide range of signals (Canvas, WebGL, ClientRects, Fonts, Headers, etc.).

> **Live Demo**: [See your browser fingerprint now](https://dev.yemel.org/fptest)


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

## Disclaimer

This project is intended for educational and research purposes only.
It should not be used for malicious tracking or privacy-invasive practices.

## License
MIT License
