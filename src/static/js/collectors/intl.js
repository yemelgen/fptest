async function collectIntl() {
    const result = {};

    // Collect resolved options and format results from each Intl constructor

    // Collator
    try {
        const collator = new Intl.Collator();
        const opts = collator.resolvedOptions();
        result.collator = {
            locale: opts.locale,
            usage: opts.usage,
            sensitivity: opts.sensitivity,
            collation: opts.collation,
            numeric: opts.numeric
        };
    } catch (e) {
        result.collator = { error: e.message };
    }

    // DateTimeFormat
    try {
        const dtf = new Intl.DateTimeFormat(undefined, {
            month: 'long', timeZone: 'UTC', timeZoneName: 'long'
        });
        const opts = dtf.resolvedOptions();
        // Use a fixed date for deterministic output
        const formatted = dtf.format(new Date('1970-01-11T00:00:00Z'));
        result.dateTimeFormat = {
            locale: opts.locale,
            calendar: opts.calendar,
            numberingSystem: opts.numberingSystem,
            timeZone: opts.timeZone,
            formatted
        };
    } catch (e) {
        result.dateTimeFormat = { error: e.message };
    }

    // DisplayNames
    try {
        if (typeof Intl.DisplayNames !== 'undefined') {
            const dn = new Intl.DisplayNames(undefined, { type: 'language' });
            const opts = dn.resolvedOptions();
            result.displayNames = {
                locale: opts.locale,
                type: opts.type,
                style: opts.style,
                formatted: dn.of('en-US')
            };
        } else {
            result.displayNames = { supported: false };
        }
    } catch (e) {
        result.displayNames = { error: e.message };
    }

    // ListFormat
    try {
        if (typeof Intl.ListFormat !== 'undefined') {
            const lf = new Intl.ListFormat(undefined, { type: 'disjunction' });
            const opts = lf.resolvedOptions();
            result.listFormat = {
                locale: opts.locale,
                type: opts.type,
                style: opts.style,
                formatted: lf.format(['0', '1'])
            };
        } else {
            result.listFormat = { supported: false };
        }
    } catch (e) {
        result.listFormat = { error: e.message };
    }

    // NumberFormat
    try {
        const nf = new Intl.NumberFormat(undefined, { notation: 'compact' });
        const opts = nf.resolvedOptions();
        result.numberFormat = {
            locale: opts.locale,
            numberingSystem: opts.numberingSystem,
            notation: opts.notation,
            formatted: nf.format(21000000)
        };
    } catch (e) {
        result.numberFormat = { error: e.message };
    }

    // PluralRules
    try {
        const pr = new Intl.PluralRules();
        const opts = pr.resolvedOptions();
        result.pluralRules = {
            locale: opts.locale,
            type: opts.type,
            selectedOne: pr.select(1),
            selectedZero: pr.select(0),
            selectedMany: pr.select(100)
        };
    } catch (e) {
        result.pluralRules = { error: e.message };
    }

    // RelativeTimeFormat
    try {
        if (typeof Intl.RelativeTimeFormat !== 'undefined') {
            const rtf = new Intl.RelativeTimeFormat(undefined, { style: 'long' });
            const opts = rtf.resolvedOptions();
            result.relativeTimeFormat = {
                locale: opts.locale,
                style: opts.style,
                numeric: opts.numeric,
                formatted: rtf.format(1, 'year')
            };
        } else {
            result.relativeTimeFormat = { supported: false };
        }
    } catch (e) {
        result.relativeTimeFormat = { error: e.message };
    }

    // Collect unique locales across all constructors
    const locales = new Set();
    for (const key of Object.keys(result)) {
        if (result[key] && result[key].locale) {
            locales.add(result[key].locale);
        }
    }
    result.locales = [...locales].sort();

    return { intl: result };
}
