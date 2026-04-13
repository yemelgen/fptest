"""Shared utility functions for fptest."""

from typing import Any


def safe_dict(data: dict[str, Any], key: str) -> dict[str, Any]:
    """Get a dict value from data, returning {} if missing or not a dict."""

    val = data.get(key)
    return val if isinstance(val, dict) else {}
