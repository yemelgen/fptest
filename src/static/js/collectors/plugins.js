async function collectPlugins() {
    const results = {
        plugins: {
            plugins: [],
            mimeTypes: []
        }
    };

    try {
        const pluginMap = {};

        for (let i = 0; i < navigator.plugins.length; i++) {
            const p = navigator.plugins[i];

            const pluginEntry = {
                name: p.name ?? null,
                description: p.description ?? null,
                filename: p.filename ?? null,
                mimeTypes: []
            };

            results.plugins.plugins.push(pluginEntry);
            pluginMap[p.name] = pluginEntry;
        }

        for (let i = 0; i < navigator.mimeTypes.length; i++) {
            const mt = navigator.mimeTypes[i];

            const mimeRecord = {
                type: mt.type ?? null,
                suffixes: mt.suffixes ?? null,
                description: mt.description ?? null,
                enabledPlugin: mt.enabledPlugin?.name ?? null
            };

            results.plugins.mimeTypes.push(
                `${mimeRecord.description}~~${mimeRecord.type}~~${mimeRecord.suffixes}`
            );

            // Attach to the correct plugin
            if (mimeRecord.enabledPlugin && pluginMap[mimeRecord.enabledPlugin]) {
                pluginMap[mimeRecord.enabledPlugin].mimeTypes.push(mimeRecord);
            }
        }

    } catch (error) {
        results.plugins.error = error.toString();
    }

    return results;
}
