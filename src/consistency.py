import re
from typing import Any

from constants import COMMON_DPRS, CONSISTENCY_DEDUCTION_PER_ISSUE, VALID_DEVICE_MEMORY
from utils import safe_dict


def check_platform_consistency(data: dict[str, Any]) -> dict[str, Any]:
    """Cross-validate platform across navigator, UA, worker, and fonts."""

    signals = {}
    issues = []

    nav = safe_dict(data, "navigator")
    ua = nav.get("userAgent", "") or ""
    platform = nav.get("platform", "") or ""

    # Worker platform
    worker = data.get("worker", {})
    worker_platform = ""
    worker_ua = ""
    if isinstance(worker, dict):
        worker_platform = worker.get("platform", "")
        worker_ua = worker.get("userAgent", "")

    signals["ua"] = ua[:100] if ua else None
    signals["platform"] = platform
    signals["worker_platform"] = worker_platform or None
    signals["worker_ua"] = worker_ua[:100] if worker_ua else None

    # Check main vs worker platform
    if platform and worker_platform and platform != worker_platform:
        issues.append(f"platform mismatch: main={platform} worker={worker_platform}")

    # Check main vs worker UA
    if ua and worker_ua and ua != worker_ua:
        issues.append("userAgent mismatch between main thread and worker")

    # Check platform vs UA consistency
    ua_lower = ua.lower()
    if platform:
        if "win" in platform.lower() and "windows" not in ua_lower and "win" not in ua_lower:
            issues.append("platform says Windows but UA does not")
        elif "mac" in platform.lower() and "mac" not in ua_lower:
            issues.append("platform says Mac but UA does not")
        elif "linux" in platform.lower() and "linux" not in ua_lower:
            issues.append("platform says Linux but UA does not")

    # userAgentData cross-check
    ua_data = nav.get("userAgentData", {})
    if isinstance(ua_data, dict) and ua_data.get("platform"):
        uad_platform = ua_data["platform"].lower()
        if ("win" in platform.lower() and "windows" not in uad_platform) or (
            "mac" in platform.lower() and "mac" not in uad_platform
        ):
            issues.append("userAgentData.platform inconsistent with navigator.platform")

    # Navigator trusted value validation
    dnt = nav.get("doNotTrack")
    if dnt is not None:
        trusted_dnt = {"1", "true", "yes", "0", "false", "no", "unspecified", "null", "undefined"}
        if str(dnt) not in trusted_dnt:
            issues.append(f"non-standard doNotTrack value: {dnt}")

    gpc = (
        nav.get("extraProperties", {}).get("globalPrivacyControl")
        if isinstance(nav.get("extraProperties"), dict)
        else None
    )
    if gpc is not None:
        trusted_gpc = {"1", "true", "yes", "0", "false", "no", "unspecified", "null", "undefined"}
        if str(gpc) not in trusted_gpc:
            issues.append(f"non-standard globalPrivacyControl value: {gpc}")

    if platform:
        trusted_platforms = (
            "win",
            "linux",
            "mac",
            "arm",
            "pike",
            "iphone",
            "ipad",
            "ipod",
            "android",
            "x11",
            "cros",
            "freebsd",
        )
        platform_lower = platform.lower()
        if not any(tp in platform_lower for tp in trusted_platforms):
            issues.append(f"unrecognized navigator.platform: {platform}")

    return {"signals": signals, "issues": issues, "consistent": len(issues) == 0}


def check_timezone_consistency(data: dict[str, Any]) -> dict[str, Any]:
    """Cross-validate timezone across datetime, worker, and Intl."""

    issues = []
    signals = {}

    dt = safe_dict(data, "datetime")
    worker = data.get("worker", {})
    intl = data.get("intl", {})

    # Main timezone
    main_tz = dt.get("timezone", "")
    signals["main_timezone"] = main_tz

    # Worker timezone
    worker_tz = ""
    if isinstance(worker, dict):
        worker_tz_data = worker.get("timezone", {})
        if isinstance(worker_tz_data, dict):
            worker_tz = worker_tz_data.get("timezone", "")
        elif isinstance(worker_tz_data, str):
            worker_tz = worker_tz_data
    signals["worker_timezone"] = worker_tz or None

    if main_tz and worker_tz and main_tz != worker_tz:
        issues.append(f"timezone mismatch: main={main_tz} worker={worker_tz}")

    # Intl locale consistency
    if isinstance(intl, dict):
        dtf = intl.get("dateTimeFormat", {})
        if isinstance(dtf, dict):
            intl_tz = dtf.get("timeZone", "")
            signals["intl_timezone"] = intl_tz
            # Note: Intl might report UTC if we set it that way, so only flag if main is not UTC
            if main_tz and intl_tz and main_tz != "UTC" and intl_tz != "UTC" and main_tz != intl_tz:
                issues.append("Intl timezone differs from navigator timezone")

    # Timezone offset consistency
    main_offset = dt.get("timezoneOffset")
    signals["main_offset"] = main_offset

    return {"signals": signals, "issues": issues, "consistent": len(issues) == 0}


def check_webgl_consistency(data: dict[str, Any]) -> dict[str, Any]:
    """Cross-validate WebGL renderer between main thread and worker."""

    issues = []
    signals = {}

    webgl = data.get("webgl", {})
    worker = data.get("worker", {})

    main_renderer = ""
    main_vendor = ""
    if isinstance(webgl, dict):
        basic = webgl.get("basicInfo", {})
        if isinstance(basic, dict):
            main_renderer = basic.get("unmaskedRenderer", "")
            main_vendor = basic.get("unmaskedVendor", "")

    signals["main_renderer"] = main_renderer or None
    signals["main_vendor"] = main_vendor or None

    worker_renderer = ""
    worker_vendor = ""
    if isinstance(worker, dict):
        worker_webgl = worker.get("webgl", {})
        if isinstance(worker_webgl, dict):
            worker_renderer = worker_webgl.get("renderer", "")
            worker_vendor = worker_webgl.get("vendor", "")

    signals["worker_renderer"] = worker_renderer or None
    signals["worker_vendor"] = worker_vendor or None

    if main_renderer and worker_renderer and main_renderer != worker_renderer:
        issues.append(f"WebGL renderer mismatch: main={main_renderer[:60]} worker={worker_renderer[:60]}")

    if main_vendor and worker_vendor and main_vendor != worker_vendor:
        issues.append(f"WebGL vendor mismatch: main={main_vendor} worker={worker_vendor}")

    return {"signals": signals, "issues": issues, "consistent": len(issues) == 0}


def check_hardware_consistency(data: dict[str, Any]) -> dict[str, Any]:
    """Cross-validate hardware info between main thread and worker."""

    issues = []
    signals = {}

    nav = safe_dict(data, "navigator")
    worker = data.get("worker", {})

    main_cores = nav.get("hardwareConcurrency")
    main_memory = nav.get("deviceMemory")
    signals["main_cores"] = main_cores
    signals["main_memory"] = main_memory

    if isinstance(worker, dict):
        worker_cores = worker.get("hardwareConcurrency")
        worker_memory = worker.get("deviceMemory")
        signals["worker_cores"] = worker_cores
        signals["worker_memory"] = worker_memory

        if main_cores and worker_cores and main_cores != worker_cores:
            issues.append(f"hardwareConcurrency mismatch: main={main_cores} worker={worker_cores}")

        if main_memory and worker_memory and main_memory != worker_memory:
            issues.append(f"deviceMemory mismatch: main={main_memory} worker={worker_memory}")

    # Check if values are reasonable
    if main_cores is not None and (not isinstance(main_cores, (int, float)) or main_cores < 1 or main_cores > 512):
        issues.append(f"unreasonable hardwareConcurrency: {main_cores}")

    if main_memory is not None and main_memory not in VALID_DEVICE_MEMORY:
        issues.append(f"non-standard deviceMemory: {main_memory}")

    return {"signals": signals, "issues": issues, "consistent": len(issues) == 0}


def check_language_consistency(data: dict[str, Any]) -> dict[str, Any]:
    """Cross-validate language across navigator, Intl, and worker."""

    issues = []
    signals = {}

    nav = safe_dict(data, "navigator")
    intl = data.get("intl", {})
    worker = data.get("worker", {})
    main_lang = nav.get("language", "") or ""
    main_langs = nav.get("languages", []) or []
    signals["main_language"] = main_lang
    signals["main_languages"] = main_langs

    # Worker language
    if isinstance(worker, dict):
        worker_lang = worker.get("language", "")
        signals["worker_language"] = worker_lang or None

        if main_lang and worker_lang and main_lang != worker_lang:
            issues.append(f"language mismatch: main={main_lang} worker={worker_lang}")

    # Intl locales
    if isinstance(intl, dict):
        intl_locales = intl.get("locales", [])
        signals["intl_locales"] = intl_locales

        if intl_locales and main_lang:
            # The primary language tag should appear in Intl locales
            main_tag = main_lang.split("-")[0].lower()
            intl_tags = [loc.split("-")[0].lower() for loc in intl_locales]
            if main_tag not in intl_tags:
                issues.append("navigator.language primary tag not in Intl locales")

    return {"signals": signals, "issues": issues, "consistent": len(issues) == 0}


def check_screen_consistency(data: dict[str, Any]) -> dict[str, Any]:
    """Cross-validate screen dimensions with other signals."""
    issues = []
    signals = {}

    screen = data.get("screen", {})
    if not isinstance(screen, dict):
        return {"signals": {}, "issues": [], "consistent": True}

    width = screen.get("width")
    height = screen.get("height")
    avail_width = screen.get("availWidth")
    avail_height = screen.get("availHeight")
    dpr = screen.get("devicePixelRatio")

    signals["width"] = width
    signals["height"] = height
    signals["dpr"] = dpr

    # Available dimensions should not exceed total
    if width and avail_width and avail_width > width:
        issues.append("availWidth > width")
    if height and avail_height and avail_height > height:
        issues.append("availHeight > height")

    # Check for non-integer screen dimensions (VM spoofing)
    if width and not isinstance(width, int):
        issues.append("non-integer screen width")
    if height and not isinstance(height, int):
        issues.append("non-integer screen height")

    # DPR should be a common value
    if dpr is not None and dpr not in COMMON_DPRS and dpr > 0:
        issues.append(f"unusual devicePixelRatio: {dpr}")

    # 800x600 is the default headless Chrome resolution
    if width == 800 and height == 600:
        issues.append("screen resolution 800x600 (common headless default)")

    return {"signals": signals, "issues": issues, "consistent": len(issues) == 0}


def check_webrtc_consistency(data: dict[str, Any]) -> dict[str, Any]:
    """Cross-validate WebRTC codec set against detected engine."""

    issues = []
    signals = {}

    webrtc = data.get("webrtc", {})
    if not isinstance(webrtc, dict) or not webrtc.get("supported"):
        return {"signals": {}, "issues": [], "consistent": True}

    codecs_sdp = webrtc.get("codecsSdp", {})
    if not isinstance(codecs_sdp, dict):
        return {"signals": {}, "issues": [], "consistent": True}

    video_codecs = codecs_sdp.get("video", [])
    audio_codecs = codecs_sdp.get("audio", [])

    video_mimes = set()
    audio_mimes = set()
    if isinstance(video_codecs, list):
        video_mimes = {c.get("mimeType", "") for c in video_codecs if isinstance(c, dict)}
    if isinstance(audio_codecs, list):
        audio_mimes = {c.get("mimeType", "") for c in audio_codecs if isinstance(c, dict)}

    signals["video_codecs"] = sorted(video_mimes)
    signals["audio_codecs"] = sorted(audio_mimes)

    # Safari/WebKit may return empty SDP codecs - that's normal for JSC
    nav = safe_dict(data, "navigator")
    ua = (nav.get("userAgent", "") or "").lower()
    is_safari = "safari" in ua and "chrome" not in ua

    # Basic sanity: non-Safari browsers should have codecs
    if not is_safari:
        if not video_mimes and not audio_mimes:
            issues.append("WebRTC SDP has no codecs at all")
        elif not video_mimes:
            issues.append("WebRTC SDP has no video codecs")
        elif not audio_mimes:
            issues.append("WebRTC SDP has no audio codecs")

    # V8/Blink browsers should have VP8 and Opus at minimum
    # (but we don't hard-fail on this since configs vary)

    return {"signals": signals, "issues": issues, "consistent": len(issues) == 0}


def check_intl_consistency(data: dict[str, Any]) -> dict[str, Any]:
    """Cross-validate Intl constructor locales with each other and navigator."""

    issues = []
    signals = {}

    intl = data.get("intl", {})
    if not isinstance(intl, dict):
        return {"signals": {}, "issues": [], "consistent": True}

    nav = safe_dict(data, "navigator")
    worker = data.get("worker", {})

    # Collect all Intl locales
    intl_locales = {}
    for key in (
        "collator",
        "dateTimeFormat",
        "displayNames",
        "listFormat",
        "numberFormat",
        "pluralRules",
        "relativeTimeFormat",
    ):
        sub = intl.get(key, {})
        if isinstance(sub, dict) and sub.get("locale"):
            intl_locales[key] = sub["locale"]

    signals["intl_locales"] = intl_locales

    # All Intl constructors should resolve to the same locale
    unique_locales = set(intl_locales.values())
    if len(unique_locales) > 1:
        issues.append(f"Intl constructors resolve to different locales: {', '.join(sorted(unique_locales))}")

    # Intl locale should match navigator.language base tag
    main_lang = nav.get("language", "") or ""
    if main_lang and unique_locales:
        main_tag = main_lang.split("-")[0].lower()
        intl_tags = {loc.split("-")[0].lower() for loc in unique_locales}
        if main_tag not in intl_tags:
            issues.append(f"Intl locale base ({', '.join(intl_tags)}) differs from navigator.language ({main_tag})")

    # Worker locale cross-check
    if isinstance(worker, dict):
        worker_locale = worker.get("locale", {})
        if isinstance(worker_locale, dict):
            worker_sys = worker_locale.get("systemCurrencyLocale", "")
            if worker_sys and unique_locales:
                worker_tag = worker_sys.split("-")[0].lower()
                main_intl_tags = {loc.split("-")[0].lower() for loc in unique_locales}
                if worker_tag not in main_intl_tags:
                    issues.append(f"Worker locale base ({worker_tag}) differs from main Intl locales")
                signals["worker_locale"] = worker_sys

    # Numbering system consistency
    dtf = intl.get("dateTimeFormat", {})
    nf = intl.get("numberFormat", {})
    if isinstance(dtf, dict) and isinstance(nf, dict):
        dtf_ns = dtf.get("numberingSystem", "")
        nf_ns = nf.get("numberingSystem", "")
        if dtf_ns and nf_ns and dtf_ns != nf_ns:
            issues.append(f"Numbering system mismatch: dateTimeFormat={dtf_ns} numberFormat={nf_ns}")

    return {"signals": signals, "issues": issues, "consistent": len(issues) == 0}


def check_codec_consistency(data: dict[str, Any]) -> dict[str, Any]:
    """Cross-validate media codec support against declared browser/engine."""

    issues = []
    signals = {}

    codecs = data.get("codecs", {})
    if not isinstance(codecs, dict):
        return {"signals": {}, "issues": [], "consistent": True}

    video = codecs.get("video", {})
    audio = codecs.get("audio", {})
    if not isinstance(video, dict) or not isinstance(audio, dict):
        return {"signals": {}, "issues": [], "consistent": True}

    signals["video_codecs"] = video
    signals["audio_codecs"] = audio

    # Detect engine from other data for cross-ref
    nav = safe_dict(data, "navigator")
    ua = (nav.get("userAgent", "") or "").lower()

    # Chrome/Blink: should support VP8, VP9, H264, Opus
    if "chrome" in ua or "chromium" in ua:
        if not video.get("vp8"):
            issues.append("Chrome UA but VP8 not supported")
        if not video.get("h264"):
            issues.append("Chrome UA but H264 not supported")
        if not audio.get("opus"):
            issues.append("Chrome UA but Opus not supported")

    # Firefox: should support VP8, VP9, Opus, Theora
    # Note: Theora depends on system codecs on Linux; modern distros often don't ship it
    if "firefox" in ua:
        platform_str = (nav.get("platform", "") or "").lower()
        is_linux = "linux" in platform_str or "linux" in ua
        if not video.get("vp8"):
            issues.append("Firefox UA but VP8 not supported")
        if not video.get("theora") and not is_linux:
            issues.append("Firefox UA but Theora not supported")
        if not audio.get("opus"):
            issues.append("Firefox UA but Opus not supported")

    # Safari: should support H264, AAC, MP3; may lack VP8/Theora
    if "safari" in ua and "chrome" not in ua:
        if not video.get("h264"):
            issues.append("Safari UA but H264 not supported")
        if not audio.get("aac"):
            issues.append("Safari UA but AAC not supported")

    # Basic sanity: any browser should support at least one video and audio codec
    has_any_video = any(v for v in video.values() if v)
    has_any_audio = any(v for v in audio.values() if v)
    if not has_any_video:
        issues.append("No video codecs supported at all")
    if not has_any_audio:
        issues.append("No audio codecs supported at all")

    return {"signals": signals, "issues": issues, "consistent": len(issues) == 0}


def check_css_consistency(data: dict[str, Any]) -> dict[str, Any]:
    """Cross-validate CSS feature support against declared browser."""

    issues = []
    signals = {}

    css = data.get("cssFeatures", {})
    if not isinstance(css, dict):
        return {"signals": {}, "issues": [], "consistent": True}

    signals["features"] = css

    # Skip CSS checks for privacy browsers (shields can block CSS features)
    resistance = data.get("resistance", {})
    if isinstance(resistance, dict) and resistance.get("privacy"):
        return {"signals": signals, "issues": [], "consistent": True}

    nav = safe_dict(data, "navigator")
    ua = (nav.get("userAgent", "") or "").lower()

    # Features expected in all modern browsers
    universal_features = ["display: grid", "display: flex", "position: sticky", "gap: 1px"]
    for feat in universal_features:
        if css.get(feat) is False:
            issues.append(f"'{feat}' not supported (expected in all modern browsers)")

    chrome_match = re.search(r"chrome/(\d+)", ua)
    firefox_match = re.search(r"firefox/(\d+)", ua)
    safari_match = re.search(r"version/(\d+).*safari", ua)

    # Chrome version-gated features
    if chrome_match:
        chrome_ver = int(chrome_match.group(1))
        chrome_features = [
            (76, "backdrop-filter"),
            (93, "accent-color: red"),
            (105, "container-type: inline-size"),
            (111, "color: lab(50% 40 30)"),
            (117, "grid-template-columns: subgrid"),
            (120, "selector(&)"),
        ]
        for min_ver, feat in chrome_features:
            if chrome_ver >= min_ver and css.get(feat) is False:
                issues.append(f"Chrome {chrome_ver} should support '{feat}' (added in {min_ver})")

    # Firefox version-gated features
    if firefox_match:
        ff_ver = int(firefox_match.group(1))
        ff_features = [
            (103, "backdrop-filter"),
            (113, "color: lab(50% 40 30)"),
            (117, "selector(&)"),
            (121, "container-type: inline-size"),
        ]
        for min_ver, feat in ff_features:
            if ff_ver >= min_ver and css.get(feat) is False:
                issues.append(f"Firefox {ff_ver} should support '{feat}' (added in {min_ver})")

    # Safari version-gated features
    if safari_match:
        safari_ver = int(safari_match.group(1))
        safari_features = [
            (15, "aspect-ratio: 1"),
            (16, "container-type: inline-size"),
            (16, "grid-template-columns: subgrid"),
        ]
        for min_ver, feat in safari_features:
            if safari_ver >= min_ver and css.get(feat) is False:
                issues.append(f"Safari {safari_ver} should support '{feat}' (added in {min_ver})")

    return {"signals": signals, "issues": issues, "consistent": len(issues) == 0}


def check_storage_consistency(data: dict[str, Any]) -> dict[str, Any]:
    """Validate storage API availability patterns."""

    issues = []
    signals = {}

    storage = data.get("storage", {})
    if not isinstance(storage, dict):
        return {"signals": {}, "issues": [], "consistent": True}

    signals["localStorage"] = storage.get("localStorage")
    signals["sessionStorage"] = storage.get("sessionStorage")
    signals["indexedDB"] = storage.get("indexedDB")
    signals["webSQL"] = storage.get("webSQL")
    signals["quota"] = storage.get("quota")

    # localStorage and sessionStorage should always be available together
    local = storage.get("localStorage")
    session = storage.get("sessionStorage")
    if local is not None and session is not None and local != session:
        issues.append("localStorage and sessionStorage availability mismatch")

    # Storage quota of 0 or very small is suspicious
    quota = storage.get("quota")
    if isinstance(quota, (int, float)) and quota > 0 and quota < 1_000_000:
        issues.append(f"Very small storage quota: {quota} bytes")

    return {"signals": signals, "issues": issues, "consistent": len(issues) == 0}


def check_permissions_consistency(data: dict[str, Any]) -> dict[str, Any]:
    """Validate permission states for consistency."""

    issues = []
    signals = {}

    permissions = data.get("permissions")
    if not isinstance(permissions, dict):
        return {"signals": {}, "issues": [], "consistent": True}

    supported = {k: v for k, v in permissions.items() if v != "unsupported"}
    signals["queryable_count"] = len(supported)
    signals["states"] = permissions

    # clipboard-write is usually "granted" in Chrome by default
    nav = safe_dict(data, "navigator")
    ua = (nav.get("userAgent", "") or "").lower()
    if "chrome" in ua and permissions.get("clipboard-write") == "denied":
        issues.append("clipboard-write denied in Chrome (usually granted by default)")

    # If push is "granted" but notifications is "denied", that's contradictory
    if permissions.get("push") == "granted" and permissions.get("notifications") == "denied":
        issues.append("push granted but notifications denied (contradictory)")

    return {"signals": signals, "issues": issues, "consistent": len(issues) == 0}


def run_all_consistency_checks(data: dict[str, Any]) -> dict[str, Any]:
    """Run all cross-signal consistency checks.

    Returns: {checks: {name: result}, total_issues, overall_score}
    """

    checks = {
        "platform": check_platform_consistency(data),
        "timezone": check_timezone_consistency(data),
        "webgl": check_webgl_consistency(data),
        "hardware": check_hardware_consistency(data),
        "language": check_language_consistency(data),
        "screen": check_screen_consistency(data),
        "webrtc": check_webrtc_consistency(data),
        "intl": check_intl_consistency(data),
        "codecs": check_codec_consistency(data),
        "css": check_css_consistency(data),
        "storage": check_storage_consistency(data),
        "permissions": check_permissions_consistency(data),
    }

    total_issues = sum(len(c["issues"]) for c in checks.values())
    consistent_count = sum(1 for c in checks.values() if c["consistent"])

    # Score: 100 = fully consistent, deduct per issue
    score = max(0, 100 - (total_issues * CONSISTENCY_DEDUCTION_PER_ISSUE))

    return {
        "checks": checks,
        "total_issues": total_issues,
        "consistent_checks": consistent_count,
        "total_checks": len(checks),
        "overall_score": score,
    }
