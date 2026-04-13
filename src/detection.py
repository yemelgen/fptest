import re
from collections import Counter
from typing import Any

import datasets
from constants import AUTOMATION_EXACT, AUTOMATION_PREFIXES, PRIVACY_EXPECTED_SIGNALS


def detect_engine(data: dict[str, Any]) -> dict[str, Any]:
    """Detect JavaScript engine from collected data.

    Uses math precision, error messages, and window keys to identify:
    'v8' (Chrome/Edge/Opera), 'spidermonkey' (Firefox), 'jsc' (Safari), 'unknown'
    """
    results: dict[str, str] = {}

    # Method 1: Math precision
    results["math"] = datasets.match_engine_by_math(data.get("math"))

    # Method 2: Error messages
    results["errors"] = datasets.match_engine_by_errors(data.get("errors"))

    # Method 3: Window keys / engine globals
    window_keys = data.get("windowKeys", {})
    engine_globals = window_keys.get("engineGlobals", {})
    prefixed = window_keys.get("prefixed", {})

    if engine_globals.get("safari") or engine_globals.get("ApplePaySession"):
        results["globals"] = "jsc"
    elif engine_globals.get("netscape") or engine_globals.get("InstallTrigger"):
        results["globals"] = "spidermonkey"
    elif len(prefixed.get("moz", [])) > 3:
        # Moz-prefixed globals survive across Firefox versions (unlike netscape/InstallTrigger)
        results["globals"] = "spidermonkey"
    elif engine_globals.get("chrome"):
        results["globals"] = "v8"
    elif len(prefixed.get("webkit", [])) > 5 and not engine_globals.get("chrome"):
        results["globals"] = "jsc"
    else:
        results["globals"] = "unknown"

    # Method 4: Resistance detector engine (from JS-side engine fingerprint)
    resistance = data.get("resistance", {})
    if isinstance(resistance, dict):
        r_engine = resistance.get("engine", "")
        engine_map = {"Blink": "v8", "Gecko": "spidermonkey", "JavaScriptCore": "jsc"}
        if r_engine in engine_map:
            results["resistance"] = engine_map[r_engine]

    # Consensus with weighted tie-breaking.
    # globals and resistance are harder to spoof than math/errors precision,
    # so they get priority when there's a tie.
    votes = [v for v in results.values() if v != "unknown"]
    if not votes:
        engine = "unknown"
    else:
        counter = Counter(votes)
        top_count = counter.most_common(1)[0][1]
        tied = [e for e, c in counter.items() if c == top_count]
        if len(tied) == 1:
            engine = tied[0]
        else:
            for method in ("globals", "resistance"):
                candidate = results.get(method)
                if candidate and candidate != "unknown" and candidate in tied:
                    engine = candidate
                    break
            else:
                engine = tied[0]

    return {
        "engine": engine,
        "methods": results,
        "confidence": "high" if len(set(votes)) == 1 and len(votes) >= 2 else "medium" if votes else "low",
    }


def detect_platform(data: dict[str, Any]) -> dict[str, Any]:
    """Detect the declared and actual platform from collected data.

    Cross-references navigator, user agent, and fonts to determine if
    the declared platform matches reality.
    """
    nav = data.get("navigator", {})
    ua: str = nav.get("userAgent", "")
    platform: str = nav.get("platform", "")

    # Extract declared platform from UA
    declared = "unknown"
    if re.search(r"Windows", ua, re.I):
        declared = "windows"
    elif re.search(r"Mac\s?OS|Macintosh", ua, re.I):
        declared = "macos"
    elif re.search(r"Linux", ua, re.I) and not re.search(r"Android", ua, re.I):
        declared = "linux"
    elif re.search(r"Android", ua, re.I):
        declared = "android"
    elif re.search(r"iPhone|iPad|iPod", ua, re.I):
        declared = "ios"
    elif re.search(r"CrOS", ua, re.I):
        declared = "chromeos"

    # Detect from navigator.platform
    platform_os = "unknown"
    if re.search(r"Win", platform):
        platform_os = "windows"
    elif re.search(r"Mac", platform):
        platform_os = "macos"
    elif re.search(r"iPhone|iPad|iPod", platform, re.I):
        platform_os = "ios"
    elif re.search(r"Linux", platform) and not re.search(r"Android", ua, re.I):
        platform_os = "linux"
    elif re.search(r"Linux", platform) and re.search(r"Android", ua, re.I):
        platform_os = "android"

    # Detect from fonts
    fonts_data = data.get("fonts", {})
    font_list: list[str] = []
    if isinstance(fonts_data, list):
        font_list = fonts_data
    elif isinstance(fonts_data, dict):
        if "detected" in fonts_data:
            font_list = fonts_data["detected"]
        else:
            font_list = [k for k, v in fonts_data.items() if v is True or (isinstance(v, dict) and v.get("available"))]

    font_result = datasets.match_fonts_to_os(font_list)

    # Detect from WebGL renderer
    webgl = data.get("webgl", {})
    basic_info = webgl.get("basicInfo", {})
    renderer: str = basic_info.get("unmaskedRenderer", "")
    gpu_result = datasets.match_gpu(renderer)

    # Check if GPU brand is consistent with platform
    gpu_data = datasets.load_gpu_signatures()
    platform_gpus = gpu_data.get("platform_gpu_map", {}).get(declared, [])
    gpu_consistent = (
        any(brand.lower() in renderer.lower() for brand in platform_gpus) if renderer and platform_gpus else None
    )

    return {
        "declared": declared,
        "platform_os": platform_os,
        "font_detected_os": font_result.get("detected_os"),
        "font_confidence": font_result.get("confidence"),
        "gpu": gpu_result,
        "gpu_platform_consistent": gpu_consistent,
        "ua_platform_match": declared == platform_os,
        "ua_font_match": (declared == font_result.get("detected_os")) if font_result.get("detected_os") else None,
    }


def _check_headless_signals(data: dict[str, Any]) -> list[dict[str, str]]:
    """Check headless collector signals for bot indicators."""
    signals: list[dict[str, str]] = []
    headless = data.get("headless", {})
    hs = headless.get("signals", {})

    nav = data.get("navigator", {})
    ua = (nav.get("userAgent", "") or "").lower()
    platform_str = (nav.get("platform", "") or "").lower()

    if hs.get("headlessUA"):
        signals.append(
            {"signal": "headless_ua", "severity": "critical", "detail": "HeadlessChrome detected in user agent"}
        )

    if hs.get("permissionsBug"):
        signals.append(
            {
                "signal": "permissions_bug",
                "severity": "high",
                "detail": "Notification permission inconsistency (Blink headless bug)",
            }
        )

    if hs.get("badChromeRuntime"):
        signals.append(
            {
                "signal": "bad_chrome_runtime",
                "severity": "high",
                "detail": "chrome.runtime methods have prototype (stealth plugin)",
            }
        )

    if hs.get("suspiciousGPU"):
        signals.append(
            {
                "signal": "suspicious_gpu",
                "severity": "high",
                "detail": "Known headless/VM GPU: " + str(hs.get("gpuRenderer", "")),
            }
        )

    if hs.get("noPlugins"):
        signals.append({"signal": "no_plugins", "severity": "medium", "detail": "No browser plugins detected"})

    if hs.get("noTaskbar"):
        is_mobile = bool(re.search(r"iphone|ipad|ipod|android", ua))
        is_linux = "linux" in platform_str or "linux" in ua
        if not is_mobile:
            signals.append(
                {
                    "signal": "no_taskbar",
                    "severity": "low" if is_linux else "medium",
                    "detail": "Screen height equals available height (no taskbar)",
                }
            )

    if hs.get("iframeProxy") and hs.get("noChrome"):
        signals.append(
            {
                "signal": "iframe_proxy",
                "severity": "high",
                "detail": "iframe srcdoc has chrome object but main window does not (stealth plugin)",
            }
        )

    if hs.get("highChromeIndex"):
        signals.append(
            {
                "signal": "high_chrome_index",
                "severity": "medium",
                "detail": "chrome object at unusual position in window keys",
            }
        )

    if hs.get("hasKnownBgColor"):
        is_macos = bool(re.search(r"mac\s?os|macintosh", ua))
        if not is_macos:
            signals.append(
                {
                    "signal": "known_bg_color",
                    "severity": "high",
                    "detail": "CSS ActiveText renders as rgb(255,0,0) (headless default)",
                }
            )

    if hs.get("noWebShare"):
        signals.append(
            {
                "signal": "no_web_share",
                "severity": "high",
                "detail": "Chrome 94+ missing navigator.share/canShare (headless)",
            }
        )

    if hs.get("pdfDisabled"):
        signals.append(
            {
                "signal": "pdf_viewer_disabled",
                "severity": "medium",
                "detail": "navigator.pdfViewerEnabled is false (headless indicator)",
            }
        )

    if hs.get("blankUADataPlatform"):
        signals.append(
            {
                "signal": "blank_uadata_platform",
                "severity": "high",
                "detail": "userAgentData.platform is empty string (headless indicator)",
            }
        )

    # ContentIndex and ContactsManager are Android-only APIs
    is_android = "android" in ua

    if hs.get("noContentIndex") and is_android:
        signals.append(
            {
                "signal": "no_content_index",
                "severity": "medium",
                "detail": "Chrome 84+ missing ContentIndex API (headless indicator)",
            }
        )

    if hs.get("noContactsManager") and is_android:
        signals.append(
            {
                "signal": "no_contacts_manager",
                "severity": "medium",
                "detail": "Chrome 80+ missing ContactsManager API (headless indicator)",
            }
        )

    return signals


def _check_lie_signals(data: dict[str, Any]) -> list[dict[str, str]]:
    """Check lie detection data for bot indicators."""
    signals: list[dict[str, str]] = []
    lies = data.get("lies", {})
    lie_count: int = lies.get("totalCount", 0)

    if lie_count > 0:
        severity = "critical" if lie_count > 10 else "high" if lie_count > 3 else "medium"
        signals.append(
            {
                "signal": "api_lies",
                "severity": severity,
                "detail": f"{lie_count} API lies detected across {lies.get('affectedApis', 0)} APIs",
            }
        )

    if lies.get("toStringLied"):
        signals.append(
            {
                "signal": "tostring_proxy",
                "severity": "critical",
                "detail": "Function.prototype.toString has been proxied",
            }
        )

    return signals


def _check_audio_canvas_signals(data: dict[str, Any]) -> list[dict[str, str]]:
    """Check audio and canvas data for manipulation indicators."""
    signals: list[dict[str, str]] = []

    audio = data.get("audio", {})
    audio_result = datasets.match_audio_pattern(audio)
    if audio_result.get("suspicious"):
        for flag in audio_result["flags"]:
            signals.append(
                {
                    "signal": "audio_" + flag["flag"],
                    "severity": flag["severity"],
                    "detail": f"Audio anomaly: {flag['flag']}",
                }
            )

    canvas = data.get("canvas", {})
    pixel_noise = canvas.get("pixelNoise", {})
    if pixel_noise.get("noiseDetected"):
        signals.append(
            {
                "signal": "canvas_noise",
                "severity": "high",
                "detail": f"Canvas pixel noise detected on channels: {pixel_noise.get('modifiedChannels')}",
            }
        )

    return signals


def _check_client_litter_signals(data: dict[str, Any]) -> list[dict[str, str]]:
    """Check window keys for automation framework globals."""
    signals: list[dict[str, str]] = []
    window_keys = data.get("windowKeys", {})
    if not isinstance(window_keys, dict):
        return signals

    client_litter = window_keys.get("clientLitter", {})
    if not isinstance(client_litter, dict) or client_litter.get("error"):
        return signals

    injected: list[str] = client_litter.get("injectedKeys", [])
    litter_count: int = client_litter.get("count", 0)

    found_automation = [
        k for k in injected if k in AUTOMATION_EXACT or any(k.startswith(p) for p in AUTOMATION_PREFIXES)
    ]
    if found_automation:
        signals.append(
            {
                "signal": "automation_globals",
                "severity": "critical",
                "detail": f"Automation framework globals: {', '.join(found_automation[:5])}",
            }
        )
    elif litter_count > 50:
        signals.append(
            {
                "signal": "excessive_globals",
                "severity": "medium",
                "detail": f"{litter_count} injected globals detected",
            }
        )

    return signals


def _check_environment_signals(data: dict[str, Any]) -> list[dict[str, str]]:
    """Check storage, permissions, webrtc, and connection for anomalies."""
    signals: list[dict[str, str]] = []

    storage = data.get("storage", {})
    if isinstance(storage, dict):
        if storage.get("localStorage") is False and storage.get("sessionStorage") is False:
            signals.append(
                {
                    "signal": "no_storage",
                    "severity": "high",
                    "detail": "Both localStorage and sessionStorage unavailable",
                }
            )
        if storage.get("indexedDB") is False:
            signals.append({"signal": "no_indexeddb", "severity": "medium", "detail": "IndexedDB not available"})

    permissions = data.get("permissions")
    if isinstance(permissions, dict):
        states = {k: v for k, v in permissions.items() if v != "unsupported"}
        if states and all(v == "denied" for v in states.values()) and len(states) >= 3:
            signals.append(
                {
                    "signal": "all_permissions_denied",
                    "severity": "medium",
                    "detail": f"All {len(states)} queryable permissions are denied",
                }
            )

    webrtc = data.get("webrtc", {})
    if isinstance(webrtc, dict) and not webrtc.get("supported"):
        signals.append(
            {
                "signal": "no_webrtc",
                "severity": "medium",
                "detail": "WebRTC not supported (common in headless browsers)",
            }
        )

    connection = data.get("connection", {})
    if isinstance(connection, dict) and connection.get("supported") and connection.get("rtt") == 0:
        signals.append({"signal": "zero_rtt", "severity": "medium", "detail": "Network RTT is exactly 0ms"})

    return signals


def _suppress_privacy_signals(signals: list[dict[str, str]], data: dict[str, Any]) -> list[dict[str, str]]:
    """Remove expected signals for verified privacy browsers."""
    resistance = data.get("resistance", {})
    privacy_browser = resistance.get("privacy") if isinstance(resistance, dict) else None

    if privacy_browser not in ("Brave", "Tor Browser", "Firefox"):
        return signals

    return [s for s in signals if s["signal"] not in PRIVACY_EXPECTED_SIGNALS]


def detect_bot_signals(data: dict[str, Any]) -> list[dict[str, str]]:
    """Detect bot/automation signals from collected data.

    Returns list of triggered signals with severity.
    """
    signals: list[dict[str, str]] = []

    nav = data.get("navigator", {})
    if nav.get("webdriver"):
        signals.append({"signal": "webdriver", "severity": "critical", "detail": "navigator.webdriver is true"})

    signals.extend(_check_headless_signals(data))
    signals.extend(_check_lie_signals(data))
    signals.extend(_check_audio_canvas_signals(data))
    signals.extend(_check_client_litter_signals(data))
    signals.extend(_check_environment_signals(data))

    return _suppress_privacy_signals(signals, data)


def detect_resistance(data: dict[str, Any]) -> dict[str, Any]:
    """Classify privacy/resistance browser from resistance collector data."""
    resistance = data.get("resistance", {})
    if not isinstance(resistance, dict):
        return {"privacy_browser": None, "mode": None, "engine": None, "timer_protection": False}

    timer = resistance.get("timerPrecision", {})
    return {
        "privacy_browser": resistance.get("privacy"),
        "mode": resistance.get("mode"),
        "engine": resistance.get("engine"),
        "timer_protection": timer.get("protection", False) if isinstance(timer, dict) else False,
    }
