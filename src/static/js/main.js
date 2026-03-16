async function runCollectors() {
    const utilityNames = [
        "collectAudioOffline",
        "summarizeFloat32",
        "collectAudioRealtime",
        "formatRect",
        "summarizeError",
        "normalizeStack",
        "measureRecursionDepth",
        "getMassiveFontList",
        "testFontMetrics",
        "testTransparency",
        "testSubPixel",
        "testGradient",
        "testShadows",
        "testCurves",
        "testImageScaling",
        "sampleTextArea",
        "testShapes",
        "testTextRendering",
        "testMediaQueries",
        "getInternalFormats",
        "testBufferMappingSupport",
        "testWebGL",
        "isWebGL2",
        "testCompositeOperations",
        "getShaderPrecisions",
        "getExtensionParameters",
        "testBufferCapabilities",
        "samplePixels",
        "testLineStyles",
        "testFonts",
        "getWebGLParameters",
        "shaderCompileCheck",
        "testShaderCapabilities",
        "testComputeCapabilities",
        "detectAllFontsComprehensive",
        "detectAlgorithms",
        "copyToClipboard",
        "detectHTTP2Support",
        "detectVendorFlavors",
        "runRectTests",
        "runCollectors",
        "testFunction",
        "testProtoMethod",
        "testPixelNoise",
        "testEmojiMetrics",
        "collectVoices",
    ]
    const collectors = [
        collectNavigator,
        collectPrototypes,
        collectChromiumData,
        collectMath,
        collectErrors,
        collectTimezone,
        collectConnection,
        collectUIBars,
        collectScreen,
        collectClientRects,
        collectStorage,
        collectPermissions,
        collectPlugins,
        collectCodecs,
        collectFonts,
        collectVideoCard,
        collectWebGL,
        collectWebGPU,
        collectMediaDevices,
        collectInputDevices,
        collectBattery,
        collectOrientation,
        collectSensors,
        collectAudio,
        collectCanvas,
        collectCSSFeatures,
        collectTLS,
        collectWorker,
        collectLies,
        collectHeadless,
        collectIntl,
        collectSVG,
        collectWindowKeys,
        collectWebRTC,
        collectResistance,
    ];

    window.__collectorMarkers = window.__collectorMarkers || {};

    for (const fn of collectors) {
        if (fn.name) window.__collectorMarkers[fn.name] = true;
    }

    for (const name of utilityNames) {
        window.__collectorMarkers[name] = true;
    }

    const results = {};
    for (let fn of collectors) {
        const name = fn.name || 'unknown';
        console.log(`[fptest] running: ${name}`);
        try {
            // 10s timeout per collector to prevent hangs
            const result = await Promise.race([
                fn(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('timeout')), 10000)
                )
            ]);
            Object.assign(results, result);
            console.log(`[fptest] done: ${name}`);
        } catch (e) {
            console.warn(`[fptest] failed: ${name} — ${e.message}`);
            results[name] = { error: e.message };
        }
    }

    try {
        // Send to server and get response
        const response = await fetch("/api/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify(results)
        });

        if (response.ok) {
            const serverData = await response.json();

            // Hide loading, show results
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('results').classList.remove('hidden');

            // Store raw JSON for copy-to-clipboard
            document.getElementById('raw-output').textContent =
                JSON.stringify(serverData, null, 2);

            // Render collapsible tree
            const output = document.getElementById('output');
            output.innerHTML = '';
            output.appendChild(renderJSON(serverData));
        } else {
            throw new Error('Server error: ' + response.status);
        }
    } catch (e) {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error').classList.remove('hidden');
        document.getElementById('error').textContent = 'Error: ' + e.message;
    }
}
document.addEventListener('DOMContentLoaded', runCollectors);
