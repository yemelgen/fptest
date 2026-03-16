async function collectStorage() {
    let local = false, session = false, indexed = false, webSQL = false, quota = null, usage = null;

    try {
        localStorage.setItem("fp_test", "1");
        local = localStorage.getItem("fp_test") === "1";
        localStorage.removeItem("fp_test");
    } catch {}

    try {
        sessionStorage.setItem("fp_test", "1");
        session = sessionStorage.getItem("fp_test") === "1";
        sessionStorage.removeItem("fp_test");
    } catch {}

    try { indexed = !!window.indexedDB; } catch {}
    try { webSQL = !!window.openDatabase; } catch {}

    try {
        if (navigator.storage && navigator.storage.estimate) {
            ({ quota, usage } = await navigator.storage.estimate());
        }
    } catch {}

    return { storage: {
        localStorage: local,
        sessionStorage: session,
        indexedDB: indexed,
        webSQL: webSQL,
        quota, usage
    } };
}
