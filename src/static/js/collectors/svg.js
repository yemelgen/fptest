async function collectSVG() {
    const ns = 'http://www.w3.org/2000/svg';
    let svg = null;
    try {
        svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', '500');
        svg.setAttribute('height', '200');
        svg.style.position = 'absolute';
        svg.style.left = '-9999px';
        svg.style.top = '-9999px';
        document.body.appendChild(svg);

        const testStrings = [
            { text: 'Cwm fjord bank glyphs vext quiz', font: 'monospace', size: '16px' },
            { text: 'Cwm fjord bank glyphs vext quiz', font: 'sans-serif', size: '16px' },
            { text: 'Cwm fjord bank glyphs vext quiz', font: 'serif', size: '16px' },
            { text: 'The quick brown fox', font: 'Arial', size: '20px' },
            { text: 'The quick brown fox', font: 'Times New Roman', size: '20px' },
        ];

        const emojiTests = ['😀', '👾', '🔬', '🏳️‍🌈', '👨‍👩‍👧‍👦'];

        const textLengths = {};
        const bboxes = {};

        // Test regular text
        for (const test of testStrings) {
            const textEl = document.createElementNS(ns, 'text');
            textEl.setAttribute('x', '10');
            textEl.setAttribute('y', '50');
            textEl.style.fontFamily = test.font;
            textEl.style.fontSize = test.size;
            textEl.textContent = test.text;
            svg.appendChild(textEl);

            const key = `${test.font}_${test.size}`;
            textLengths[key] = textEl.getComputedTextLength();
            const bbox = textEl.getBBox();
            bboxes[key] = {
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height
            };
            svg.removeChild(textEl);
        }

        // Test emojis - dimensions vary by OS/renderer
        const emojiMetrics = {};
        for (const emoji of emojiTests) {
            const textEl = document.createElementNS(ns, 'text');
            textEl.setAttribute('x', '10');
            textEl.setAttribute('y', '50');
            textEl.style.fontSize = '24px';
            textEl.textContent = emoji;
            svg.appendChild(textEl);

            emojiMetrics[emoji] = {
                length: textEl.getComputedTextLength(),
                bbox: {
                    width: textEl.getBBox().width,
                    height: textEl.getBBox().height
                }
            };
            svg.removeChild(textEl);
        }

        return {
            svg: {
                supported: true,
                textLengths,
                bboxes,
                emojiMetrics
            }
        };
    } catch (e) {
        return { svg: { supported: false, error: e.message } };
    } finally {
        if (svg && svg.parentNode) {
            svg.parentNode.removeChild(svg);
        }
    }
}
