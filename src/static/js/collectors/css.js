function collectCSSFeatures() {
    const features = [
        // Layout (widely supported, absence is suspicious)
        "display: grid",
        "display: flex",

        // Visual effects (version-gated)
        "backdrop-filter",
        "scroll-snap-type",
        "accent-color: red",
        "color: lab(50% 40 30)",
        "color: oklch(70% 0.15 180)",
        "color-scheme: dark",

        // Modern selectors/properties (Chrome 105+, Firefox 121+, Safari 15.4+)
        "container-type: inline-size",
        "content-visibility: auto",

        // Newer features (Chrome 111+, Safari 16.4+)
        "view-transition-name: test",
        "animation-timeline: scroll()",
        "field-sizing: content",

        // Subgrid (Firefox 71+, Chrome 117+, Safari 16+)
        "grid-template-columns: subgrid",

        // Nesting support (Chrome 120+, Firefox 117+, Safari 17.2+)
        "selector(&)",

        // Older features (expected everywhere modern)
        "position: sticky",
        "gap: 1px",
        "aspect-ratio: 1",
        "overscroll-behavior: contain",
        "touch-action: manipulation",
    ];

    const results = {};
    for (const f of features) {
        try {
            results[f] = CSS.supports(f);
        } catch (e) {
            results[f] = null;
        }
    }

    return { cssFeatures: results };
}
