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
    for (let i = 0; i < data.length; i += Math.floor(data.length / 64) || 1) {
        hash = ((hash << 5) - hash + Math.floor(data[i] * 1e6)) | 0;
    }

    return { min, max, mean, variance, hash };
}

async function collectAudioOffline(seconds = 0.1) {
    try {
        const sampleRate = 44100;
        const length = sampleRate * seconds;
        const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, length, sampleRate);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 440;
        gain.gain.value = 0.0001; // Very quiet to avoid any actual sound

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(seconds); // Stop quickly to minimize processing

        const rendered = await ctx.startRendering();
        const channelData = rendered.getChannelData(0);

        // Suspicious audio checks
        const suspiciousFlags = {};

        // 1. copyFromChannel vs getChannelData comparison
        try {
            const copyBuffer = new Float32Array(channelData.length);
            rendered.copyFromChannel(copyBuffer, 0);
            let mismatchCount = 0;
            for (let i = 0; i < channelData.length; i++) {
                if (channelData[i] !== copyBuffer[i]) mismatchCount++;
            }
            suspiciousFlags.sampleMismatch = mismatchCount > 0;
            suspiciousFlags.mismatchCount = mismatchCount;
        } catch (e) {
            suspiciousFlags.sampleMismatch = null;
        }

        // 2. Unique sample count - too many unique samples suggests noise injection
        try {
            const uniqueSamples = new Set(channelData);
            suspiciousFlags.uniqueSampleCount = uniqueSamples.size;
            suspiciousFlags.tooManyUnique = uniqueSamples.size === channelData.length;
        } catch (e) {
            suspiciousFlags.tooManyUnique = null;
        }

        // 3. All zeros check - suggests blocking
        try {
            const allZeros = channelData.every(v => v === 0);
            suspiciousFlags.allZeros = allZeros;
        } catch (e) {
            suspiciousFlags.allZeros = null;
        }

        return {
            audio: {
                type: "offline",
                supported: true,
                sampleRate,
                length: channelData.length,
                summary: summarizeFloat32(channelData),
                suspiciousFlags
            }
        };
    } catch (e) {
        return {
            audio: {
                type: "offline",
                supported: false,
                error: e.message
            }
        };
    }
}

async function collectAudioRealtime() {
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return {
            audio: {
                type: "realtime",
                supported: false
            }
        };

        const ctx = new AC();

        // Check if context is suspended (requires user gesture)
        if (ctx.state === "suspended") {
            return {
                audio: {
                    type: "realtime",
                    supported: true,
                    suspended: true,
                    sampleRate: ctx.sampleRate,
                    error: "AudioContext suspended - requires user gesture"
                }
            };
        }

        const osc = ctx.createOscillator();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;

        osc.type = 'sine';
        osc.frequency.value = 440;
        osc.connect(analyser);
        analyser.connect(ctx.destination);
        osc.start();

        // Wait a moment to fill analyser
        await new Promise(res => setTimeout(res, 50));

        const freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);

        const timeData = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(timeData);

        osc.stop();

        // close context cleanly
        try { await ctx.close(); } catch (_) {}

        const normalizedFreq = Float32Array.from(freqData, v => (v / 128) - 1);
        const normalizedTime = Float32Array.from(timeData, v => (v / 128) - 1);

        return {
            audio: {
                type: "realtime",
                supported: true,
                suspended: false,
                sampleRate: ctx.sampleRate,
                fftSize: analyser.fftSize,
                summary: summarizeFloat32(normalizedFreq),
                timeSummary: summarizeFloat32(normalizedTime),
                latency: {
                    base: ctx.baseLatency || null,
                    output: ctx.outputLatency || null
                }
            }
        };
    } catch (e) {
        return {
            audio: {
                type: "realtime",
                supported: false,
                error: e.message
            }
        };
    }
}

async function collectVoices() {
    try {
        if (typeof speechSynthesis === 'undefined') {
            return { supported: false };
        }

        let voices = speechSynthesis.getVoices();
        if (voices.length === 0) {
            voices = await new Promise((resolve) => {
                const timeout = setTimeout(() => resolve([]), 2000);
                speechSynthesis.addEventListener('voiceschanged', () => {
                    clearTimeout(timeout);
                    resolve(speechSynthesis.getVoices());
                }, { once: true });
                const retry = speechSynthesis.getVoices();
                if (retry.length > 0) {
                    clearTimeout(timeout);
                    resolve(retry);
                }
            });
        }

        return {
            supported: true,
            count: voices.length,
            list: voices.map(v => ({
                name: v.name,
                lang: v.lang,
                localService: v.localService,
                default: v.default
            }))
        };
    } catch (e) {
        return { supported: false, error: e.message };
    }
}

async function collectAudio() {
    const result = {
        audio: {
            supported: !!(window.AudioContext || window.webkitAudioContext),
            offline: null,
            realtime: null,
            voices: null,
            requiresUserGesture: false
        }
    };

    if (!result.audio.supported) {
        result.audio.voices = await collectVoices();
        return result;
    }

    try {
        // Try offline first (usually works without user gesture)
        const offlineResult = await collectAudioOffline(0.1); // Shorter duration
        result.audio.offline = offlineResult.audio;

        // Try realtime
        const realtimeResult = await collectAudioRealtime();
        result.audio.realtime = realtimeResult.audio;

        // Check if user gesture is required
        if (realtimeResult.audio.suspended) {
            result.audio.requiresUserGesture = true;
        }

    } catch (e) {
        result.audio.error = e.message;
    }

    // Voices (speech synthesis)
    result.audio.voices = await collectVoices();

    return result;
}
