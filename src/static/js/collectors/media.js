async function collectMediaDevices() {
    const capabilities = {
        supported: !!navigator.mediaDevices,
        mediaDevices: !!navigator.mediaDevices,
        bluetooth: !!navigator.bluetooth,
        usb: !!navigator.usb,
        xr: !!navigator.xr,
        gamepads: typeof navigator.getGamepads === "function",
        queries: testMediaQueries()
    };

    const result = {
        multimediaDevices: {
            speakers: [],
            micros: [],
            webcams: []
        },
        capabilities
    };

    if (!navigator.mediaDevices?.enumerateDevices) {
        return result;
    }

    try {
        const devices = await Promise.race([
            navigator.mediaDevices.enumerateDevices(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);

        for (const d of devices) {
            const entry = {
                deviceId: d.deviceId || null,
                label: d.label || null,
                groupId: d.groupId || null,
                kind: d.kind
            };

            if (d.kind === "audioinput") {
                result.multimediaDevices.micros.push(entry);
            } else if (d.kind === "audiooutput") {
                result.multimediaDevices.speakers.push(entry);
            } else if (d.kind === "videoinput") {
                result.multimediaDevices.webcams.push(entry);
            }
        }
    } catch (err) {
        result.capabilities.error = err.toString();
    }

    return result;
}

function testMediaQueries() {
    function matchMediaFirst(queries) {
        for (const q of queries) {
            if (window.matchMedia(q).matches) {
                return q.replace(/\(|\)/g, '').split(': ').pop();
            }
        }
        return "none";
    }

    return {
        prefersDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        hover: window.matchMedia("(hover: hover)").matches,
        pointerCoarse: window.matchMedia("(pointer: coarse)").matches,
        highContrast: window.matchMedia("(forced-colors: active)").matches,
        anyHover: window.matchMedia("(any-hover: hover)").matches,
        anyPointer: matchMediaFirst([
            "(any-pointer: fine)", "(any-pointer: coarse)", "(any-pointer: none)"
        ]),
        colorGamut: matchMediaFirst([
            "(color-gamut: rec2020)", "(color-gamut: p3)", "(color-gamut: srgb)"
        ]),
        displayMode: matchMediaFirst([
            "(display-mode: fullscreen)", "(display-mode: standalone)",
            "(display-mode: minimal-ui)", "(display-mode: browser)"
        ]),
        invertedColors: window.matchMedia("(inverted-colors: inverted)").matches,
        monochrome: window.matchMedia("(monochrome)").matches,
        orientation: window.matchMedia("(orientation: landscape)").matches ? "landscape" : "portrait",
        deviceAspectRatio: `${screen.width}/${screen.height}`
    };
}
