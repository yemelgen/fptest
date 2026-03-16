async function collectHeadless() {
    const signals = {};
    const isBlink = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);

    // navigator.webdriver - set by automation frameworks
    signals.webdriver = !!navigator.webdriver;

    // HeadlessChrome in user agent
    signals.headlessUA = /HeadlessChrome/.test(navigator.userAgent) || /HeadlessChrome/.test(navigator.appVersion);

    // Permissions bug — Blink-specific inconsistency
    // Notification.permission='denied' but permissions.query reports 'prompt'
    try {
        if (typeof Notification !== 'undefined' && navigator.permissions) {
            const notifPerm = Notification.permission;
            const queryResult = await navigator.permissions.query({ name: 'notifications' });
            signals.permissionsBug = (notifPerm === 'denied' && queryResult.state === 'prompt');
        } else {
            signals.permissionsBug = null;
        }
    } catch (e) {
        signals.permissionsBug = null;
    }

    // No plugins (suspicious in Blink)
    signals.noPlugins = navigator.plugins ? navigator.plugins.length === 0 : true;

    // No mimeTypes
    signals.noMimeTypes = navigator.mimeTypes ? navigator.mimeTypes.length === 0 : true;

    // No taskbar — screen.height === screen.availHeight
    signals.noTaskbar = (screen.height === screen.availHeight && screen.width === screen.availWidth);

    // Notification denied
    try {
        signals.notificationDenied = typeof Notification !== 'undefined' && Notification.permission === 'denied';
    } catch (e) {
        signals.notificationDenied = null;
    }

    // pdfViewerEnabled disabled
    signals.pdfDisabled = navigator.pdfViewerEnabled === false;

    // Bad chrome.runtime — stealth detection
    // Real Chrome has sendMessage/connect without 'prototype' property
    try {
        if (window.chrome && window.chrome.runtime) {
            const sm = window.chrome.runtime.sendMessage;
            const cn = window.chrome.runtime.connect;
            signals.badChromeRuntime = (
                (sm && 'prototype' in sm) ||
                (cn && 'prototype' in cn)
            ) || false;
        } else {
            signals.badChromeRuntime = null;
        }
    } catch (e) {
        signals.badChromeRuntime = null;
    }

    // No chrome object in Blink browser
    try {
        signals.noChrome = isBlink && !('chrome' in window);
    } catch (e) {
        signals.noChrome = false;
    }

    // High chrome index — stealth plugins add chrome late
    try {
        if ('chrome' in window) {
            const keys = Object.keys(window);
            const idx = keys.indexOf('chrome');
            signals.highChromeIndex = idx > -1 ? (keys.length - idx < 50) : null;
        } else {
            signals.highChromeIndex = null;
        }
    } catch (e) {
        signals.highChromeIndex = null;
    }

    // iframe srcdoc proxy detection — stealth.js artifact
    {
        let iframe = null;
        try {
            iframe = document.createElement('iframe');
            iframe.srcdoc = 'blank';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            await new Promise(r => setTimeout(r, 50));
            signals.iframeProxy = !!(iframe.contentWindow && iframe.contentWindow.chrome);
        } catch (e) {
            signals.iframeProxy = null;
        } finally {
            if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }
    }

    // visualViewport matches screen — suggests no browser chrome
    try {
        if (window.visualViewport) {
            signals.vvpMatchesScreen = (
                visualViewport.width === screen.width &&
                visualViewport.height === screen.height
            );
        } else {
            signals.vvpMatchesScreen = null;
        }
    } catch (e) {
        signals.vvpMatchesScreen = null;
    }

    // userAgentData platform is blank (suspicious)
    try {
        if (navigator.userAgentData) {
            signals.blankUADataPlatform = navigator.userAgentData.platform === '';
        } else {
            signals.blankUADataPlatform = null;
        }
    } catch (e) {
        signals.blankUADataPlatform = null;
    }

    // Known suspicious GPUs
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (gl) {
            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            if (ext) {
                const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
                signals.suspiciousGPU = /SwiftShader|llvmpipe|VirtualBox|ANGLE.*Direct3D9/.test(renderer);
                signals.gpuRenderer = renderer;
            }
        }
    } catch (e) {
        signals.suspiciousGPU = null;
    }

    // ActiveText background color — headless Chrome renders as rgb(255, 0, 0)
    try {
        if (isBlink) {
            const div = document.createElement('div');
            div.style.backgroundColor = 'ActiveText';
            document.body.appendChild(div);
            const bg = getComputedStyle(div).backgroundColor;
            document.body.removeChild(div);
            signals.hasKnownBgColor = bg === 'rgb(255, 0, 0)';
        } else {
            signals.hasKnownBgColor = null;
        }
    } catch (e) {
        signals.hasKnownBgColor = null;
    }

    // Web Share API missing on Chrome 94+ (headless indicator)
    try {
        if (isBlink && CSS.supports('accent-color: initial')) {
            signals.noWebShare = !('share' in navigator) || !('canShare' in navigator);
        } else {
            signals.noWebShare = null;
        }
    } catch (e) {
        signals.noWebShare = null;
    }

    // ContentIndex API missing on Chrome 84+
    try {
        if (isBlink && CSS.supports('appearance: initial')) {
            signals.noContentIndex = !('ContentIndex' in window);
        } else {
            signals.noContentIndex = null;
        }
    } catch (e) {
        signals.noContentIndex = null;
    }

    // ContactsManager API missing on Chrome 80+
    try {
        if (isBlink && 'getVideoPlaybackQuality' in HTMLVideoElement.prototype) {
            signals.noContactsManager = !('ContactsManager' in window);
        } else {
            signals.noContactsManager = null;
        }
    } catch (e) {
        signals.noContactsManager = null;
    }

    // NetworkInformation.downlinkMax missing
    try {
        if (typeof NetworkInformation !== 'undefined' && NetworkInformation.prototype) {
            signals.noDownlinkMax = !('downlinkMax' in NetworkInformation.prototype);
        } else {
            signals.noDownlinkMax = null;
        }
    } catch (e) {
        signals.noDownlinkMax = null;
    }

    // Count true signals (excluding null)
    const trueSignals = Object.entries(signals)
        .filter(([k, v]) => v === true && k !== 'gpuRenderer')
        .map(([k]) => k);

    return {
        headless: {
            signals,
            triggeredCount: trueSignals.length,
            triggeredSignals: trueSignals
        }
    };
}
