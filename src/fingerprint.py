import hashlib
import json
from typing import Any

from constants import FEATURES, STABLE_HASH_FEATURES


def stable_stringify(obj: Any) -> str:
    """Deterministic JSON serialization suitable for hashing."""

    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hex(s: str) -> str:
    """Compute SHA256 hex digest of a string."""

    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def summarize_value(v: Any, max_len: int = 200) -> str:
    """Return a short summary of a value for debugging/logging."""

    s = stable_stringify(v)
    return s if len(s) <= max_len else s[:max_len] + "...(truncated)"


def hex_to_bin(hexstr: str) -> str:
    return bin(int(hexstr, 16))[2:].zfill(len(hexstr) * 4)


def hamming_distance(hex1: str, hex2: str) -> int:
    """Bitwise Hamming distance between two SHA256 hex strings."""

    b1 = hex_to_bin(hex1)
    b2 = hex_to_bin(hex2)
    length = max(len(b1), len(b2))
    b1 = b1.zfill(length)
    b2 = b2.zfill(length)
    return sum(c1 != c2 for c1, c2 in zip(b1, b2, strict=False))


def dice_coefficient(set_a: set, set_b: set) -> float:
    """Dice similarity coefficient for two sets."""

    if not set_a and not set_b:
        return 1.0
    inter = len(set_a & set_b)
    return 2 * inter / (len(set_a) + len(set_b))


def extract_features(data: dict[str, Any]) -> dict[str, Any]:
    """Extract and normalize fingerprint features from raw JSON."""

    features: dict[str, Any] = {}
    for k in FEATURES:
        if k in data:
            features[k] = data[k]

    # include canvas subfeatures that are high-entropy
    if "canvas" in data:
        for sub in ("textRendering", "subPixel", "composite", "shapes", "gradient", "lineStyles", "webgl"):
            if sub in data["canvas"]:
                features[f"canvas.{sub}"] = data["canvas"][sub]

    # audio.offline.summary
    if (
        "audio" in data
        and isinstance(data["audio"], dict)
        and "offline" in data["audio"]
        and isinstance(data["audio"]["offline"], dict)
    ):
        features["audio.offline.summary"] = data["audio"]["offline"].get("summary", data["audio"]["offline"])

    # battery summary - only keep supported flag, level/dischargingTime are too volatile
    if "battery" in data and isinstance(data["battery"], dict):
        battery = data["battery"]
        features["battery.summary"] = {
            "supported": battery.get("supported", True),
            "charging": battery.get("charging"),
        }

    # navigator minimal
    if "navigator" in data and isinstance(data["navigator"], dict):
        nav = data["navigator"]
        nav_pick: dict[str, Any] = {}
        for key in ("userAgent", "platform", "language"):
            if key in nav:
                nav_pick[key] = nav[key]
        if "userAgentData" in nav:
            nav_pick["uaData"] = nav["userAgentData"]
        if nav_pick:
            features["navigator.min"] = nav_pick

    # screen minimal
    if "screen" in data and isinstance(data["screen"], dict):
        scr = data["screen"]
        features["screen.min"] = {
            "colorDepth": scr.get("colorDepth"),
            "pixelDepth": scr.get("pixelDepth"),
        }

    return features


def compute_hashes(features: dict[str, Any]) -> dict[str, str]:
    """Compute per-feature SHA256 hashes."""

    return {feat: sha256_hex(stable_stringify(val)) for feat, val in features.items()}


def compute_combined_stable_hash(feature_hashes: dict[str, str]) -> tuple[str, list[str]]:
    """Combine stable feature hashes into a single hash (visitor_id).

    Returns: (combined_hash, stable_keys)
    """

    stable_keys = [k for k in feature_hashes if k in STABLE_HASH_FEATURES]

    stable_concat = "|".join(f"{k}:{feature_hashes[k]}" for k in sorted(stable_keys))
    combined_hash = sha256_hex(stable_concat)
    return combined_hash, stable_keys
