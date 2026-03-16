async function collectWindowKeys() {
    try {
        const allKeys = Object.getOwnPropertyNames(window);
        const prefixed = {
            webkit: [],
            moz: [],
            ms: [],
            on: []
        };

        for (const key of allKeys) {
            if (/^[Ww]eb[Kk]it/.test(key) || key.startsWith('webkit')) {
                prefixed.webkit.push(key);
            } else if (key.startsWith('moz') || key.startsWith('Moz')) {
                prefixed.moz.push(key);
            } else if (key.startsWith('ms') || key.startsWith('MS')) {
                prefixed.ms.push(key);
            } else if (key.startsWith('on')) {
                prefixed.on.push(key);
            }
        }

        // Engine-specific globals
        const engineGlobals = {
            // V8 / Blink specific
            chrome: 'chrome' in window,
            Atomics: 'Atomics' in window,
            SharedArrayBuffer: 'SharedArrayBuffer' in window,
            // SpiderMonkey / Gecko specific
            netscape: 'netscape' in window,
            Components: 'Components' in window,
            InstallTrigger: 'InstallTrigger' in window,
            // JavaScriptCore / WebKit specific
            webkitURL: 'webkitURL' in window,
            WebKitCSSMatrix: 'WebKitCSSMatrix' in window,
            webkitAudioContext: 'webkitAudioContext' in window,
            // Apple-specific
            safari: 'safari' in window,
            ApplePaySession: 'ApplePaySession' in window,
        };

        // Client litter: detect injected globals via iframe baseline
        let clientLitter = null;
        let iframe = null;
        try {
            iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            const cleanKeys = new Set(Object.getOwnPropertyNames(iframe.contentWindow));
            const markers = window.__collectorMarkers || {};
            const injectedKeys = allKeys.filter(k => {
                if (cleanKeys.has(k)) return false;
                if (/^\d+$/.test(k)) return false;
                if (k === '__collectorMarkers') return false;
                if (markers[k]) return false;
                return true;
            });
            clientLitter = { injectedKeys: injectedKeys.sort(), count: injectedKeys.length };
        } catch (e) {
            clientLitter = { error: e.message };
        } finally {
            if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }

        return {
            windowKeys: {
                total: allKeys.length,
                prefixed: {
                    webkit: prefixed.webkit.sort(),
                    moz: prefixed.moz.sort(),
                    ms: prefixed.ms.sort(),
                    eventHandlers: prefixed.on.length
                },
                engineGlobals,
                clientLitter
            }
        };
    } catch (e) {
        return { windowKeys: { error: e.message } };
    }
}
