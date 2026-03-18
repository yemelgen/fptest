async function collectInputDevices() {
    const input = {
        keyboard: !!navigator.keyboard,

        // Touchscreen detection
        maxTouchPoints: navigator.maxTouchPoints || 0,
        touchEventConstructor: typeof window.TouchEvent !== "undefined",
        msMaxTouchPoints: navigator.msMaxTouchPoints || 0,

        // Event-based detection
        hasTouchEvents: "ontouchstart" in window,
        hasPointerEvents: "onpointerdown" in window,
        hasWheelEvents: "onwheel" in window,
        hasGamepadEvents: "ongamepadconnected" in window,

        // Media query pointer/hover detection — reflects actual device capabilities
        // and harder to spoof than JS API presence checks
        pointer: matchMediaValue("(pointer: fine)", "(pointer: coarse)", "(pointer: none)"),
        anyPointer: matchMediaValue("(any-pointer: fine)", "(any-pointer: coarse)", "(any-pointer: none)"),
        hover: matchMediaValue("(hover: hover)", "(hover: none)"),
        anyHover: matchMediaValue("(any-hover: hover)", "(any-hover: none)"),

        // InputDeviceCapabilities API (experimental)
        pointerCapabilities: {}
    };

    try {
        if (window.InputDeviceCapabilities) {
            const mouse = new InputDeviceCapabilities({ firesTouchEvents: false });
            const touch = new InputDeviceCapabilities({ firesTouchEvents: true });
            input.pointerCapabilities = {
                supported: true,
                mouse: { firesTouchEvents: mouse.firesTouchEvents },
                touch: { firesTouchEvents: touch.firesTouchEvents }
            };
        } else {
            input.pointerCapabilities = { supported: false };
        }
    } catch (e) {
        input.pointerCapabilities = { error: e.message };
    }

    // Gamepad info
    try {
        input.gamepads = navigator.getGamepads
            ? (navigator.getGamepads() || []).map(g => g ? g.id : null)
            : null;
    } catch (e) {
        input.gamepads = { error: e.message };
    }

    // Keyboard layout (if available)
    try {
        if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
            const layout = await navigator.keyboard.getLayoutMap();
            input.keyboardLayout = {
                size: layout.size,
                sample: Object.fromEntries([...layout.entries()].slice(0, 10))
            };
        }
    } catch (e) {
        // getLayoutMap may be blocked by permissions policy
    }

    return { inputDevices: input };
}

function matchMediaValue(...queries) {
    for (const q of queries) {
        try {
            if (window.matchMedia(q).matches) {
                // Extract the value from e.g. "(pointer: fine)" -> "fine"
                const match = q.match(/:\s*([^)]+)/);
                return match ? match[1].trim() : true;
            }
        } catch (e) {
            // matchMedia not available
        }
    }
    return null;
}
