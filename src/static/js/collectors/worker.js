async function collectWorker() {
    if (!window.Worker) {
        return { worker: { supported: false } };
    }

    const workerCode = `
        function safeNavigator() {
            const nav = self.navigator || {};
            return {
                userAgent: nav.userAgent || null,
                platform: nav.platform || null,
                language: nav.language || null,
                languages: nav.languages || null,
                hardwareConcurrency: nav.hardwareConcurrency || null,
                deviceMemory: nav.deviceMemory || null,
                maxTouchPoints: nav.maxTouchPoints || null,
                userAgentData: nav.userAgentData ? {
                    mobile: nav.userAgentData.mobile,
                    brands: nav.userAgentData.brands || null,
                    platform: nav.userAgentData.platform || null
                } : null
            };
        }

        function summarizeFloat32(data) {
            let min = Infinity, max = -Infinity, sum = 0, sumSq = 0;
            for (let i = 0; i < data.length; i++) {
                const v = data[i];
                if (v < min) min = v;
                if (v > max) max = v;
                sum += v;
                sumSq += v * v;
            }
            const mean = sum / data.length;
            const variance = (sumSq / data.length) - (mean * mean);

            let hash = 0;
            for (let i = 0; i < data.length; i += 8) {
                hash = ((hash << 5) - hash + Math.floor(data[i] * 1e6)) | 0;
            }

            return { min, max, mean, variance, hash };
        }

        function getLocaleData() {
            let systemCurrencyLocale = null;
            let engineCurrencyLocale = null;

            try {
                const fmt = new Intl.NumberFormat();
                systemCurrencyLocale = fmt.resolvedOptions().locale || null;
            } catch (_) {}

            try {
                const fmt2 = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
                engineCurrencyLocale = fmt2.resolvedOptions().locale || null;
            } catch (_) {}

            return {
                systemCurrencyLocale,
                engineCurrencyLocale
            };
        }

        function getTimezoneData() {
            return {
                timezoneOffset: new Date().getTimezoneOffset(),
                timezoneLocation: Intl.DateTimeFormat().resolvedOptions().timeZone || null
            };
        }

        function getWebglInfo() {
            try {
                const canvas = new OffscreenCanvas(64, 64);
                const gl = canvas.getContext("webgl");
                if (!gl) return { webglVendor: null, webglRenderer: null };

                const ext = gl.getExtension("WEBGL_debug_renderer_info");
                if (!ext) {
                    return { webglVendor: null, webglRenderer: null };
                }

                return {
                    webglVendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
                    webglRenderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
                };
            } catch (_) {
                return { webglVendor: null, webglRenderer: null };
            }
        }

        self.onmessage = () => {
            // Performance test
            const t0 = performance.now();
            const arr = new Float32Array(256);
            for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.sin(i) * Math.random();
            }
            const t1 = performance.now();

            // Endianness
            const buf = new ArrayBuffer(4);
            new DataView(buf).setUint32(0, 0x11223344, true);
            const isLittleEndian = new Uint8Array(buf)[0] === 0x44;

            // Stack format
            const stackFormat = (() => {
                try { throw new Error("worker_test"); }
                catch (e) { return e.stack || null; }
            })();

            // Crypto
            let cryptoValues = null;
            try {
                const tmp = new Uint32Array(8);
                crypto.getRandomValues(tmp);
                cryptoValues = Array.from(tmp);
            } catch (_) {}

            self.postMessage({
                worker: {
                    supported: true,
                    performanceResolution: t1 - t0,
                    timeOrigin: performance.timeOrigin || null,
                    isLittleEndian,
                    randomSummary: summarizeFloat32(arr),
                    cryptoValues,
                    navigator: safeNavigator(),
                    errors: { stackFormat },
                    locale: getLocaleData(),
                    timezone: getTimezoneData(),
                    webgl: getWebglInfo()
                }
            });
        };
    `;

    try {
        const blob = new Blob([workerCode], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);

        return await new Promise(resolve => {
            const timeout = setTimeout(() => {
                worker.terminate();
                resolve({
                    worker: {
                        supported: true,
                        timeout: true
                    }
                });
            }, 3000);

            worker.onmessage = (e) => {
                clearTimeout(timeout);
                worker.terminate();
                resolve(e.data);
            };

            worker.postMessage("start");
        });

    } catch (e) {
        return { worker: { supported: false, error: e.message } };
    }
}
