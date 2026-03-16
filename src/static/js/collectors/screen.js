async function collectScreen() {
    const scrn = screen;

    // HDR detection (Chrome/Edge only)
    async function detectHDR() {
        try {
            if (!('query' in window.matchMedia)) return false;
            const mq = await window.matchMedia("(dynamic-range: high)");
            return mq.matches;
        } catch {
            return false;
        }
    }

    return {
        screen: {
            // base screen values
            width: scrn?.width ?? null,
            height: scrn?.height ?? null,
            availWidth: scrn?.availWidth ?? null,
            availHeight: scrn?.availHeight ?? null,
            availTop: scrn?.availTop ?? null,
            availLeft: scrn?.availLeft ?? null,

            colorDepth: scrn?.colorDepth ?? null,
            pixelDepth: scrn?.pixelDepth ?? null,

            // window metrics
            devicePixelRatio: window.devicePixelRatio ?? null,
            pageXOffset: window.pageXOffset ?? null,
            pageYOffset: window.pageYOffset ?? null,

            innerWidth: window.innerWidth ?? null,
            innerHeight: window.innerHeight ?? null,
            outerWidth: window.outerWidth ?? null,
            outerHeight: window.outerHeight ?? null,

            // screen position
            screenX: window.screenX ?? window.screenLeft ?? null,
            screenY: window.screenY ?? window.screenTop ?? null,

            // client area (document viewport)
            clientWidth: document.documentElement?.clientWidth ?? null,
            clientHeight: document.documentElement?.clientHeight ?? null,

            // HDR support
            hasHDR: await detectHDR()

            // Orientation
            //orientation: scrn?.orientation?.type ?? null,
            //orientationAngle: scrn?.orientation?.angle ?? null,
        }
    };
}
