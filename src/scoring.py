import math
from typing import Any

import consistency
import datasets
import detection
from constants import (
    BOT_PROBABILITY_MIDPOINT,
    BOT_PROBABILITY_STEEPNESS,
    CONSISTENCY_WEIGHTS,
    SEVERITY_PENALTIES,
)


def compute_authenticity_score(
    data: dict[str, Any],
    features: dict[str, Any],
    detection_result: dict[str, Any] | None = None,
    consistency_result: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Compute a comprehensive authenticity score for a browser fingerprint.

    Accepts pre-computed detection and consistency results to avoid duplicate work.
    """

    anomalies: list[dict[str, str]] = []
    penalty = 0

    if detection_result:
        engine_result = detection_result["engine"]
        platform_result = detection_result["platform"]
        bot_signals = detection_result["bot_signals"]
    else:
        engine_result = detection.detect_engine(data)
        platform_result = detection.detect_platform(data)
        bot_signals = detection.detect_bot_signals(data)

    for signal in bot_signals:
        sev = signal["severity"]
        penalty += SEVERITY_PENALTIES.get(sev, 0)
        anomalies.append({"issue": signal["detail"], "severity": sev, "category": signal["signal"]})

    if consistency_result is None:
        consistency_result = consistency.run_all_consistency_checks(data)
    consistency_score: int = consistency_result["overall_score"]

    for check_name, check in consistency_result["checks"].items():
        weight = CONSISTENCY_WEIGHTS.get(check_name, 8)
        for issue in check["issues"]:
            penalty += weight
            sev = "high" if weight >= 10 else "medium" if weight >= 6 else "low"
            anomalies.append({"issue": issue, "severity": sev, "category": "consistency." + check_name})

    # Platform Match (only penalize if not already caught by bot_signals)
    seen_categories = {a["category"] for a in anomalies}

    if platform_result.get("ua_platform_match") is False and "platform_mismatch" not in seen_categories:
        penalty += 15
        anomalies.append(
            {
                "issue": "Navigator platform does not match user agent",
                "severity": "high",
                "category": "platform_mismatch",
            }
        )

    if platform_result.get("ua_font_match") is False:
        penalty += 10
        anomalies.append(
            {
                "issue": "Detected fonts suggest different OS than declared",
                "severity": "high",
                "category": "font_os_mismatch",
            }
        )

    if platform_result.get("gpu_platform_consistent") is False and "gpu_platform_mismatch" not in seen_categories:
        penalty += 8
        anomalies.append(
            {
                "issue": "GPU brand not typical for declared platform",
                "severity": "medium",
                "category": "gpu_platform_mismatch",
            }
        )

    # Engine vs UA consistency
    engine = engine_result.get("engine", "unknown")
    nav = data.get("navigator", {})
    ua = nav.get("userAgent", "").lower()
    engine_ua_match = True

    if (
        (engine == "v8" and "chrome" not in ua and "chromium" not in ua and "edge" not in ua and "opera" not in ua)
        or (engine == "spidermonkey" and "firefox" not in ua and "gecko" not in ua)
        or (engine == "jsc" and "safari" not in ua)
    ):
        engine_ua_match = False

    if not engine_ua_match and engine != "unknown":
        confidence = engine_result.get("confidence", "medium")
        if confidence == "high":
            engine_penalty = 15
            sev = "high"
        elif confidence == "medium":
            engine_penalty = 8
            sev = "medium"
        else:
            engine_penalty = 3
            sev = "low"
        penalty += engine_penalty
        anomalies.append(
            {
                "issue": f"Detected engine ({engine}) does not match user agent (confidence: {confidence})",
                "severity": sev,
                "category": "engine_ua_mismatch",
            }
        )

    # Audio Analysis
    audio_result = datasets.match_audio_pattern(data.get("audio", {}))

    # GPU Analysis (skip if already penalized by bot_signals)
    webgl = data.get("webgl", {})
    basic_info = webgl.get("basicInfo", {}) if isinstance(webgl, dict) else {}
    renderer = basic_info.get("unmaskedRenderer", "") if isinstance(basic_info, dict) else ""
    gpu_result = datasets.match_gpu(renderer)

    if gpu_result.get("suspicious") and "suspicious_gpu" not in seen_categories:
        penalty += 10
        anomalies.append(
            {"issue": f"Suspicious GPU renderer: {renderer[:60]}", "severity": "high", "category": "suspicious_gpu"}
        )

    if gpu_result.get("vm_indicator") and "vm_gpu" not in seen_categories:
        penalty += 8
        anomalies.append({"issue": "GPU renderer suggests virtual machine", "severity": "medium", "category": "vm_gpu"})

    # Resistance / Privacy Browser
    resistance_result = detection.detect_resistance(data)

    # Lie Summary
    lies_data = data.get("lies", {})
    lie_summary = {
        "total_lies": lies_data.get("totalCount", 0),
        "affected_apis": lies_data.get("affectedApis", 0),
        "toString_lied": lies_data.get("toStringLied", False),
    }

    # Headless Indicators
    headless_data = data.get("headless", {})
    headless_indicators = headless_data.get("triggeredSignals", [])

    # Client Litter Summary
    window_keys = data.get("windowKeys", {})
    client_litter = window_keys.get("clientLitter", {}) if isinstance(window_keys, dict) else {}
    litter_summary = None
    if isinstance(client_litter, dict) and not client_litter.get("error"):
        litter_summary = {
            "injected_count": client_litter.get("count", 0),
            "sample": client_litter.get("injectedKeys", [])[:20],
        }

    # Final Score
    authenticity_score = max(0, min(100, 100 - penalty))

    # Bot probability: sigmoid of weighted penalty
    bot_probability = round(
        1.0 / (1.0 + math.exp(-BOT_PROBABILITY_STEEPNESS * (penalty - BOT_PROBABILITY_MIDPOINT))), 3
    )

    # Consistency grade
    if consistency_score >= 90:
        consistency_grade = "A"
    elif consistency_score >= 75:
        consistency_grade = "B"
    elif consistency_score >= 60:
        consistency_grade = "C"
    elif consistency_score >= 40:
        consistency_grade = "D"
    else:
        consistency_grade = "F"

    return {
        "authenticity_score": authenticity_score,
        "bot_probability": bot_probability,
        "consistency_grade": consistency_grade,
        "consistency_score": consistency_score,
        "detected_anomalies": anomalies,
        "lie_summary": lie_summary,
        "headless_indicators": headless_indicators,
        "resistance": resistance_result,
        "client_litter": litter_summary,
        "engine": engine_result,
        "platform": platform_result,
        "audio_analysis": audio_result,
        "gpu_analysis": gpu_result,
        "engine_ua_match": engine_ua_match,
    }
