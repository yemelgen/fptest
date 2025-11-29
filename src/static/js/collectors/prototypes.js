async function collectPrototypes() {
    const visited = new WeakSet();

    function collect(obj, maxDepth = 5) {
        const out = [];

        function walk(target, depth) {
            if (!target || depth > maxDepth || visited.has(target)) return;
            visited.add(target);

            let props;
            try {
                props = Object.getOwnPropertyNames(target);
            } catch {
                return;
            }

            for (const prop of props) {
                if (window.__collectorMarkers && window.__collectorMarkers[prop]) continue;

                try {
                    const desc = Object.getOwnPropertyDescriptor(target, prop);
                    const descriptorString = [
                        desc?.configurable ? 'c' : '-',
                        desc?.enumerable ? 'e' : '-',
                        desc?.writable ? 'w' : '-',
                        ('value' in desc) ? 'v' : '-',
                        desc?.get ? 'g' : '-',
                        desc?.set ? 's' : '-'
                    ].join('');
                    out.push({
                        name: prop,
                        descriptor: descriptorString,
                        stringValue:
                            desc?.value && typeof desc.value === "function"
                                ? String(desc.value)
                                : undefined,
                        getterString: desc?.get ? String(desc.get) : undefined,
                        setterString: desc?.set ? String(desc.set) : undefined
                    });
                } catch {
                    out.push({ name: prop, error: "inaccessible" });
                }
            }

            walk(Object.getPrototypeOf(target), depth + 1);
        }

        walk(obj, 0);
        return out;
    }

    return {
        prototypes: {
            windowProto: collect(window),
            navigatorProto: collect(navigator),
        }
    };
}
