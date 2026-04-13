import json
from pathlib import Path
from typing import Any

_DATA_DIR = Path(__file__).parent.parent / "data"
_cache: dict[str, Any] = {}


def _load(filename: str) -> Any:
    if filename not in _cache:
        with open(_DATA_DIR / filename) as f:
            _cache[filename] = json.load(f)
    return _cache[filename]


def load_gpu_signatures() -> dict[str, Any]:
    return _load("gpu_signatures.json")


def load_font_os_map() -> dict[str, Any]:
    return _load("font_os_map.json")


def load_math_engines() -> dict[str, Any]:
    return _load("math_engines.json")


def load_audio_patterns() -> dict[str, Any]:
    return _load("audio_patterns.json")


def match_gpu(renderer: str) -> dict[str, Any]:
    """Match a WebGL renderer string against known GPU signatures.

    Returns: {brand, confidence, known, suspicious, vm_indicator}
    """

    if not renderer:
        return {"brand": None, "confidence": "none", "known": False, "suspicious": False, "vm_indicator": False}

    data = load_gpu_signatures()
    renderer_lower = renderer.lower()
    renderer_upper = renderer.upper()

    suspicious = any(s.lower() in renderer_lower for s in data["suspicious_renderers"])
    vm_indicator = any(v.lower() in renderer_lower for v in data["virtual_machine_indicators"])
    brand = next((b for b in data["known_brands"] if b.upper() in renderer_upper), None)
    known = any(p.lower() in renderer_lower for p in data["known_renderers"])

    if known and not suspicious:
        confidence = "high"
    elif known and suspicious:
        confidence = "low"
    elif brand:
        confidence = "medium"
    else:
        confidence = "low"

    return {
        "brand": brand,
        "confidence": confidence,
        "known": known,
        "suspicious": suspicious,
        "vm_indicator": vm_indicator,
    }


def match_fonts_to_os(fonts: list[str]) -> dict[str, Any]:
    """Match a list of detected fonts to an OS and version.

    Returns: {detected_os, version, confidence, matched_fonts}
    """

    if not fonts:
        return {"detected_os": None, "version": None, "confidence": "none", "matched_fonts": []}

    data = load_font_os_map()
    font_set = {f.lower() for f in fonts} if isinstance(fonts, list) else set()

    scores: dict[str, dict[str, Any]] = {}

    for os_name in ("windows", "macos", "linux", "android", "ios"):
        os_data = data.get(os_name, {})
        best_version: str | None = None
        total_matched: list[str] = []

        common = os_data.get("common", [])
        common_matches = [f for f in common if f.lower() in font_set]
        total_matched.extend(common_matches)

        for version, version_fonts in os_data.items():
            if version == "common" or not isinstance(version_fonts, list):
                continue
            version_matches = [f for f in version_fonts if f.lower() in font_set]
            if version_matches:
                best_version = version
                total_matched.extend(version_matches)

        if total_matched:
            scores[os_name] = {"score": len(total_matched), "version": best_version, "matched": total_matched}

    if not scores:
        return {"detected_os": None, "version": None, "confidence": "none", "matched_fonts": []}

    best_os = max(scores, key=lambda k: scores[k]["score"])
    best = scores[best_os]

    if best["score"] >= 5:
        confidence = "high"
    elif best["score"] >= 2:
        confidence = "medium"
    else:
        confidence = "low"

    return {
        "detected_os": best_os,
        "version": best["version"],
        "confidence": confidence,
        "matched_fonts": best["matched"],
        "all_os_scores": {k: v["score"] for k, v in scores.items()},
    }


def match_engine_by_math(math_data: dict[str, Any] | None) -> str:
    """Identify JS engine from math function precision differences.

    Returns: engine name ('v8', 'spidermonkey', 'jsc', 'unknown')
    """

    if not math_data or not isinstance(math_data, dict):
        return "unknown"

    ref = load_math_engines()
    discriminators = ref.get("discriminators", [])

    field_map: dict[str, tuple[str, float]] = {
        "acos_0.5": ("acos", 0.5),
        "asin_0.5": ("asin", 0.5),
        "atanh_0.5": ("atanh", 0.5),
        "expm1_1": ("expm1", 1),
    }

    v8_score = 0
    sm_score = 0
    jsc_score = 0

    for disc in discriminators:
        test_name = disc["test"]
        if test_name not in field_map:
            continue

        field, _ = field_map[test_name]
        collected = math_data.get(field)
        if collected is None:
            continue

        if collected == disc.get("v8_value"):
            v8_score += 1
        if collected == disc.get("spidermonkey_value") or collected == disc.get("spidermonkey_alt_value"):
            sm_score += 1
        jsc_val = disc.get("jsc_value", disc.get("v8_value"))
        if collected == jsc_val:
            jsc_score += 1

    scores = {"v8": v8_score, "spidermonkey": sm_score, "jsc": jsc_score}
    best = max(scores, key=scores.get)
    if scores[best] == 0:
        return "unknown"
    if scores["v8"] == scores["jsc"] and scores["v8"] > scores["spidermonkey"]:
        return "v8"
    return best


def match_engine_by_errors(errors_data: dict[str, Any] | None) -> str:
    """Identify JS engine from error message patterns.

    Returns: engine name ('v8', 'spidermonkey', 'jsc', 'unknown')
    """
    if not errors_data or not isinstance(errors_data, dict):
        return "unknown"

    ref = load_math_engines()
    error_patterns = ref.get("error_messages", {})

    scores = {"v8": 0, "spidermonkey": 0, "jsc": 0}

    messages: list[str] = []
    for _key, val in errors_data.items():
        if isinstance(val, dict) and "message" in val:
            messages.append(val["message"])

    for msg in messages:
        if not msg:
            continue
        for engine, patterns in error_patterns.items():
            if not isinstance(patterns, dict):
                continue
            for _, pattern in patterns.items():
                if pattern.lower() in msg.lower():
                    scores[engine] += 1

    best = max(scores, key=scores.get)
    if scores[best] == 0:
        return "unknown"
    tied = [e for e, s in scores.items() if s == scores[best]]
    if len(tied) > 1:
        return "unknown"
    return best


def match_audio_pattern(audio_data: dict[str, Any]) -> dict[str, Any]:
    """Check audio fingerprint data against known patterns.

    Returns: {suspicious, flags, severity}
    """

    if not audio_data or not isinstance(audio_data, dict):
        return {"suspicious": False, "flags": [], "severity": "none"}

    patterns = load_audio_patterns()
    thresholds = patterns.get("thresholds", {})
    flags: list[dict[str, str]] = []

    offline = audio_data.get("offline", {})
    summary = offline.get("summary", {})
    suspicious_flags = offline.get("suspiciousFlags", {})

    if suspicious_flags.get("sampleMismatch"):
        flags.append({"flag": "sample_mismatch", "severity": "high"})
    if suspicious_flags.get("tooManyUnique"):
        flags.append({"flag": "all_unique", "severity": "medium"})
    if suspicious_flags.get("allZeros"):
        flags.append({"flag": "all_zeros", "severity": "high"})

    variance = summary.get("variance")
    if variance is not None:
        min_var = thresholds.get("min_expected_variance", 1e-20)
        max_var = thresholds.get("max_expected_variance", 0.1)
        if variance < min_var:
            flags.append({"flag": "very_low_variance", "severity": "medium"})
        elif variance > max_var:
            flags.append({"flag": "very_high_variance", "severity": "medium"})

    hash_val = summary.get("hash")
    if hash_val == 0:
        flags.append({"flag": "zero_hash", "severity": "medium"})

    max_severity = "none"
    for f in flags:
        if f["severity"] == "high":
            max_severity = "high"
            break
        elif f["severity"] == "medium" and max_severity != "high":
            max_severity = "medium"

    return {"suspicious": len(flags) > 0, "flags": flags, "severity": max_severity}
