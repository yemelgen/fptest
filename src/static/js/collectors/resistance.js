async function collectResistance() {
    // Engine detection via error message length
    function getEngineId() {
        const x = [].constructor;
        try {
            (-1).toFixed(-1);
        } catch (err) {
            return err.message.length + (x + '').split(x.name).join('').length;
        }
        return null;
    }

    const engineId = getEngineId();
    const IS_BLINK = engineId === 80;
    const IS_GECKO = engineId === 58;
    const IS_WEBKIT = engineId === 77;

    const engine = IS_BLINK ? 'Blink' : IS_GECKO ? 'Gecko' : IS_WEBKIT ? 'JavaScriptCore' : 'unknown';

    const data = {
        engine,
        privacy: null,
        mode: null,
        security: null,
        timerPrecision: null
    };

    // Timer precision detection (skip for Blink - not applicable)
    if (!IS_BLINK) {
        try {
            const regex = (n) => new RegExp(`${n}+$`);
            const delay = (ms, baseNumber, baseDate) => new Promise(resolve => setTimeout(() => {
                const date = baseDate ? baseDate : +new Date();
                const value = regex(baseNumber).test(date) ? regex(baseNumber).exec(date)[0] : date;
                resolve(value);
            }, ms));

            const baseDate = +new Date();
            const baseNumber = +('' + baseDate).slice(-1);

            const samples = [];
            for (let i = 0; i < 10; i++) {
                samples.push(await delay(i, baseNumber, i === 0 ? baseDate : undefined));
            }

            const lastChars = samples.map(s => ('' + s).slice(-1));
            const protection = lastChars.every(c => c === lastChars[0]);

            data.timerPrecision = {
                protection,
                precision: protection ? Math.min(...samples.map(v => ('' + v).length)) : null,
                precisionValue: protection ? lastChars[0] : null
            };
        } catch (_) {}
    }

    // Brave detection
    try {
        const isBrave = (
            'brave' in navigator &&
            Object.getPrototypeOf(navigator.brave).constructor.name === 'Brave' &&
            navigator.brave.isBrave.toString() === 'function isBrave() { [native code] }'
        );

        if (isBrave) {
            data.privacy = 'Brave';
            data.security = {
                FileSystemWritableFileStream: 'FileSystemWritableFileStream' in window,
                Serial: 'Serial' in window,
                ReportingObserver: 'ReportingObserver' in window
            };

            // Brave mode detection
            let mode = 'allow';
            try {
                // Strict mode: AnalyserNode float frequency data has values beyond -Infinity
                const ctx = new OfflineAudioContext(1, 1, 44100);
                const analyser = ctx.createAnalyser();
                const freqData = new Float32Array(analyser.frequencyBinCount);
                analyser.getFloatFrequencyData(freqData);
                const isStrict = new Set(freqData).size > 1;
                if (isStrict) {
                    mode = 'strict';
                } else {
                    // Standard mode: no Chrome PDF plugins
                    const chromePlugins = /(Chrom(e|ium)|Microsoft Edge) PDF (Plugin|Viewer)/;
                    const pluginsList = [...navigator.plugins];
                    const hasChromePlugins = pluginsList.filter(p => chromePlugins.test(p.name)).length === 2;
                    if (pluginsList.length && !hasChromePlugins) {
                        mode = 'standard';
                    }
                }
            } catch (_) {}
            data.mode = mode;
        }
    } catch (_) {}

    // Firefox / Tor Browser detection
    const timerProtection = data.timerPrecision && data.timerPrecision.protection;
    if (IS_GECKO && timerProtection) {
        const features = {
            OfflineAudioContext: 'OfflineAudioContext' in window,
            WebGL2RenderingContext: 'WebGL2RenderingContext' in window,
            WebAssembly: 'WebAssembly' in window,
            maxTouchPoints: 'maxTouchPoints' in navigator,
            RTCRtpTransceiver: 'RTCRtpTransceiver' in window,
            MediaDevices: 'MediaDevices' in window,
            Credential: 'Credential' in window
        };

        const torTargets = ['RTCRtpTransceiver', 'MediaDevices', 'Credential'];
        const torBrowser = torTargets.every(k => !features[k]);
        const safer = !features.WebAssembly;

        data.privacy = torBrowser ? 'Tor Browser' : 'Firefox';
        data.security = { reduceTimerPrecision: true, ...features };
        data.mode = !torBrowser ? 'resistFingerprinting' : safer ? 'safer' : 'standard';
    }

    return { resistance: data };
}
