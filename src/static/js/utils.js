function copyToClipboard() {
    const divContent = document.getElementById('raw-output').innerText;

    navigator.clipboard.writeText(divContent)
    .then(() => {
        alert('Content copied to clipboard!');
    })
    .catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function downloadJSON() {
    const content = document.getElementById('raw-output').innerText;
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fingerprint.json';
    a.click();
    URL.revokeObjectURL(url);
}

function renderJSON(value, key, depth) {
    depth = depth || 0;

    if (value === null) {
        const span = document.createElement('span');
        span.className = 'json-null';
        span.textContent = 'null';
        return span;
    }
    if (typeof value !== 'object') {
        const span = document.createElement('span');
        span.className = 'json-' + typeof value;
        span.textContent = typeof value === 'string' ? '"' + value + '"' : String(value);
        return span;
    }

    const isArray = Array.isArray(value);
    const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
    const bracket = isArray ? ['[', ']'] : ['{', '}'];

    // Empty
    if (entries.length === 0) {
        const span = document.createElement('span');
        span.innerHTML = '<span class="json-bracket">' + bracket[0] + bracket[1] + '</span>';
        return span;
    }

    // Inline: only for objects (not arrays) with 1-4 primitive-only values
    // and total inline length stays short
    if (!isArray && entries.length <= 4 && entries.every(([, v]) => v === null || typeof v !== 'object')) {
        const plain = entries.map(([k, v]) => {
            const val = v === null ? 'null' : typeof v === 'string' ? '"' + v + '"' : String(v);
            return '"' + k + '": ' + val;
        }).join(', ');
        if (plain.length < 80) {
            const span = document.createElement('span');
            const coloredParts = entries.map(([k, v]) => {
                const cls = v === null ? 'json-null'
                    : typeof v === 'string' ? 'json-string'
                    : typeof v === 'boolean' ? 'json-boolean'
                    : 'json-number';
                const val = v === null ? 'null' : typeof v === 'string' ? '"' + v + '"' : String(v);
                return '<span class="json-key">' + k + '</span>: <span class="' + cls + '">' + val + '</span>';
            });
            span.innerHTML = '<span class="json-bracket">' + bracket[0] + '</span> ' +
                coloredParts.join(', ') +
                ' <span class="json-bracket">' + bracket[1] + '</span>';
            return span;
        }
    }

    const details = document.createElement('details');

    // Auto-open logic based on path:
    // - root: always open
    // - "metadata", "detection", "scoring": open with children
    // - "data": collapsed by default
    // - everything else at depth 2+: collapse
    const path = key !== undefined ? String(key) : '';
    const metaKeys = new Set(['metadata', 'detection', 'scoring']);
    if (depth === 0) {
        details.open = true;
    } else if (depth === 1 && metaKeys.has(path)) {
        details.open = true;
    } else if (depth === 2 && metaKeys.has(path)) {
        details.open = true;
    }

    const summary = document.createElement('summary');
    const label = key !== undefined ? String(key) : '';
    const count = entries.length;
    const type = isArray ? 'items' : 'keys';
    summary.innerHTML = (label ? '<span class="json-key">' + label + '</span>: ' : '') +
        '<span class="json-bracket">' + bracket[0] + '</span>' +
        '<span class="json-count"> ' + count + ' ' + type + ' </span>' +
        '<span class="json-bracket">' + bracket[1] + '</span>';
    details.appendChild(summary);

    const content = document.createElement('div');
    content.className = 'json-content';

    for (const [k, v] of entries) {
        const row = document.createElement('div');
        row.className = 'json-row';

        const rendered = (v !== null && typeof v === 'object')
            ? renderJSON(v, k, depth + 1)
            : renderJSON(v);

        // If renderJSON returned a <details>, the key is already in the summary.
        // Otherwise (inline span or primitive), prepend the key ourselves.
        if (rendered.tagName === 'DETAILS') {
            row.appendChild(rendered);
        } else {
            const keySpan = document.createElement('span');
            keySpan.className = 'json-key';
            keySpan.textContent = String(k);
            row.appendChild(keySpan);
            row.appendChild(document.createTextNode(': '));
            row.appendChild(rendered);
        }
        content.appendChild(row);
    }

    details.appendChild(content);
    return details;
}
