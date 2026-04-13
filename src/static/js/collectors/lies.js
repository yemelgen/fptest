async function collectLies() {
    const lieResults = [];

    // Engine detection for engine-specific lie tests
    const engineId = (() => {
        const x = [].constructor;
        try { (-1).toFixed(-1); } catch (e) {
            return e.message.length + (x + '').split(x.name).join('').length;
        }
        return null;
    })();
    const IS_BLINK = engineId === 80;
    const IS_GECKO = engineId === 58;

    // Core lie test: checks if a function has been tampered with (proxy, override, etc.)
    function testFunction(fn, name, objName) {
        const lies = [];

        try {
            // toString check - native functions have specific format
            const str = Function.prototype.toString.call(fn);
            if (!/\[native code\]/.test(str)) {
                lies.push('failed toString');
            }
        } catch (e) {
            // Some proxied functions throw on toString
            lies.push('failed toString error');
        }

        try {
            // Property descriptor check - native functions should only have 'length' and 'name'
            const ownKeys = Object.getOwnPropertyNames(fn);
            const extra = ownKeys.filter(k => k !== 'length' && k !== 'name' && k !== 'prototype');
            if (extra.length > 0) {
                lies.push('failed descriptor keys: ' + extra.join(','));
            }
        } catch (e) {}

        try {
            // Reflect.ownKeys check
            const reflectKeys = Reflect.ownKeys(fn);
            const allowedKeys = new Set(['length', 'name', 'prototype']);
            const unexpected = reflectKeys.filter(k => typeof k === 'string' && !allowedKeys.has(k));
            if (unexpected.length > 0) {
                lies.push('failed own keys');
            }
        } catch (e) {}

        try {
            // 'prototype' in function check - most native methods don't have 'prototype'
            if ('prototype' in fn && !['Function', 'Object', 'Array'].some(c => name.startsWith(c))) {
                lies.push('failed prototype in function');
            }
        } catch (e) {}

        try {
            // Object.create toString check - proxied functions behave differently
            const created = Object.create(fn);
            try {
                created.toString();
            } catch (e) {
                // Expected for native functions
            }
        } catch (e) {}

        try {
            // setPrototypeOf null check
            const clone = fn.bind();
            Object.setPrototypeOf(clone, null);
            try {
                clone.toString();
                lies.push('failed null conversion error');
            } catch (e) {
                // Expected
            }
        } catch (e) {}

        try {
            // arguments/caller access - should throw in strict mode for native functions
            const desc = Object.getOwnPropertyDescriptor(fn, 'arguments');
            if (desc && desc.value !== null && desc.value !== undefined) {
                lies.push('failed arguments descriptor');
            }
        } catch (e) {
            // TypeError expected for strict mode functions
        }

        // A. Symbol.hasInstance / Proxy detection (Blink only)
        if (IS_BLINK) {
            try {
                try { fn instanceof fn; } catch (e) {
                    if (!(e instanceof TypeError)) {
                        lies.push('failed instanceof check');
                    } else if (!/\[Symbol\.hasInstance\]/.test(e.stack || '')) {
                        lies.push('failed instanceof check');
                    }
                }
            } catch (e) {}

            try {
                const proxy = new Proxy(fn, {});
                try { proxy instanceof proxy; } catch (e) {
                    if (!(e instanceof TypeError)) {
                        lies.push('failed proxy instanceof check');
                    } else if (!/\[Symbol\.hasInstance\]/.test(e.stack || '')) {
                        lies.push('failed proxy instanceof check');
                    }
                }
            } catch (e) {}
        }

        // B. Prototype chain cycle detection
        try {
            const nativeProto = Object.getPrototypeOf(fn);
            try {
                const proxy = new Proxy(fn, {});
                Object.setPrototypeOf(proxy, Object.create(proxy)).toString();
                lies.push('failed chain cycle');
            } catch (e) {
                // Expected for native - TypeError on cycle
            } finally {
                try { Object.setPrototypeOf(fn, nativeProto); } catch (e) {}
            }
        } catch (e) {}

        // C. Reflect.setPrototypeOf detection
        if (typeof Reflect !== 'undefined') {
            try {
                const nativeProto = Object.getPrototypeOf(fn);
                const rand = '_' + Math.random().toString(36).slice(2);
                try {
                    Reflect.setPrototypeOf(fn, Object.create(fn));
                    rand in fn;
                    throw new TypeError();
                } catch (e) {
                    if (!(e instanceof TypeError)) {
                        lies.push('failed reflect set proto');
                    }
                } finally {
                    try { Object.setPrototypeOf(fn, nativeProto); } catch (e) {}
                }
            } catch (e) {}
        }

        // D. Strict mode arguments/caller (Gecko only)
        if (IS_GECKO) {
            try {
                fn.arguments; fn.caller;
            } catch (e) {
                if (!/strict mode/.test(e.message || '')) {
                    lies.push('failed strict mode proxy');
                }
            }
        }

        // F. Constructor/call/apply interface errors
        try {
            try {
                new fn(); fn.call(Object.getPrototypeOf(fn));
            } catch (e) {
                if (!(e instanceof TypeError)) {
                    lies.push('failed call interface');
                }
            }
        } catch (e) {}

        try {
            try {
                new fn(); fn.apply(Object.getPrototypeOf(fn));
            } catch (e) {
                if (!(e instanceof TypeError)) {
                    lies.push('failed apply interface');
                }
            }
        } catch (e) {}

        // G. Undefined properties (Navigator/Screen only)
        if (objName && /^(Navigator|Screen)$/i.test(objName)) {
            try {
                const instanceDesc = Object.getOwnPropertyDescriptor(
                    self[objName.toLowerCase()], name
                );
                if (instanceDesc) {
                    lies.push('failed undefined properties');
                }
            } catch (e) {}
        }

        return lies;
    }

    // Test a property getter/method on a prototype
    function testProtoMethod(obj, propName, label, objName) {
        try {
            const desc = Object.getOwnPropertyDescriptor(obj, propName);
            if (!desc) return;
            const fn = desc.get || desc.value;
            if (typeof fn !== 'function') return;
            const lies = testFunction(fn, label, objName);
            if (lies.length > 0) {
                lieResults.push({ api: label, tests: lies });
            }
        } catch (e) {}
    }

    // Navigator lies
    const navProps = [
        'userAgent', 'platform', 'hardwareConcurrency', 'deviceMemory',
        'language', 'languages', 'plugins', 'mimeTypes', 'cookieEnabled',
        'doNotTrack', 'maxTouchPoints', 'vendor', 'appVersion',
        'pdfViewerEnabled', 'webdriver'
    ];
    for (const prop of navProps) {
        testProtoMethod(Navigator.prototype, prop, 'Navigator.' + prop, 'Navigator');
    }

    // Screen lies
    const screenProps = ['width', 'height', 'availWidth', 'availHeight', 'colorDepth', 'pixelDepth'];
    for (const prop of screenProps) {
        testProtoMethod(Screen.prototype, prop, 'Screen.' + prop, 'Screen');
    }

    // Canvas lies
    try {
        testProtoMethod(HTMLCanvasElement.prototype, 'toDataURL', 'HTMLCanvasElement.toDataURL');
        testProtoMethod(HTMLCanvasElement.prototype, 'getContext', 'HTMLCanvasElement.getContext');
    } catch (e) {}

    // Canvas2D lies
    try {
        const ctx2dProps = ['fillText', 'strokeText', 'getImageData', 'measureText', 'font'];
        for (const prop of ctx2dProps) {
            testProtoMethod(CanvasRenderingContext2D.prototype, prop, 'CanvasRenderingContext2D.' + prop);
        }
    } catch (e) {}

    // WebGL lies
    try {
        const wglProps = ['getParameter', 'getExtension', 'getSupportedExtensions', 'readPixels'];
        for (const prop of wglProps) {
            testProtoMethod(WebGLRenderingContext.prototype, prop, 'WebGLRenderingContext.' + prop);
        }
    } catch (e) {}

    try {
        const wgl2Props = ['getParameter', 'getExtension', 'getSupportedExtensions'];
        for (const prop of wgl2Props) {
            testProtoMethod(WebGL2RenderingContext.prototype, prop, 'WebGL2RenderingContext.' + prop);
        }
    } catch (e) {}

    // Audio lies
    try {
        testProtoMethod(AudioBuffer.prototype, 'getChannelData', 'AudioBuffer.getChannelData');
        testProtoMethod(AudioBuffer.prototype, 'copyFromChannel', 'AudioBuffer.copyFromChannel');
        testProtoMethod(AnalyserNode.prototype, 'getFloatFrequencyData', 'AnalyserNode.getFloatFrequencyData');
        testProtoMethod(AnalyserNode.prototype, 'getByteFrequencyData', 'AnalyserNode.getByteFrequencyData');
    } catch (e) {}

    // Math lies
    const mathFns = ['cos', 'sin', 'tan', 'acos', 'asin', 'atan', 'sqrt', 'log', 'exp', 'random'];
    for (const fn of mathFns) {
        if (typeof Math[fn] === 'function') {
            const lies = testFunction(Math[fn], 'Math.' + fn);
            if (lies.length > 0) {
                lieResults.push({ api: 'Math.' + fn, tests: lies });
            }
        }
    }

    // Date lies
    try {
        testProtoMethod(Date.prototype, 'getTimezoneOffset', 'Date.getTimezoneOffset');
        const dateLies = testFunction(Date.now, 'Date.now');
        if (dateLies.length > 0) {
            lieResults.push({ api: 'Date.now', tests: dateLies });
        }
    } catch (e) {}

    // Element lies
    try {
        testProtoMethod(Element.prototype, 'getBoundingClientRect', 'Element.getBoundingClientRect');
        testProtoMethod(Element.prototype, 'getClientRects', 'Element.getClientRects');
    } catch (e) {}

    // DOMRect lies
    try {
        const rectProps = ['x', 'y', 'width', 'height', 'top', 'right', 'bottom', 'left'];
        for (const prop of rectProps) {
            testProtoMethod(DOMRect.prototype, prop, 'DOMRect.' + prop);
        }
    } catch (e) {}

    // Intl lies
    try {
        testProtoMethod(Intl.DateTimeFormat.prototype, 'resolvedOptions', 'Intl.DateTimeFormat.resolvedOptions');
        testProtoMethod(Intl.DateTimeFormat.prototype, 'format', 'Intl.DateTimeFormat.format');
    } catch (e) {}

    // Permissions lies
    try {
        testProtoMethod(Permissions.prototype, 'query', 'Permissions.query');
    } catch (e) {}

    // FontFace lies
    try {
        if (typeof FontFace !== 'undefined') {
            testProtoMethod(FontFace.prototype, 'load', 'FontFace.load');
            testProtoMethod(FontFace.prototype, 'family', 'FontFace.family');
        }
    } catch (e) {}

    // Function.prototype.toString itself - meta-lie detection
    let toStringLied = false;
    try {
        const toStr = Function.prototype.toString;
        const str = toStr.call(toStr);
        if (!/\[native code\]/.test(str)) {
            toStringLied = true;
        }
    } catch (e) {
        toStringLied = true;
    }

    const totalCount = lieResults.reduce((sum, r) => sum + r.tests.length, 0);

    return {
        lies: {
            totalCount,
            toStringLied,
            affectedApis: lieResults.length,
            lieList: lieResults
        }
    };
}
