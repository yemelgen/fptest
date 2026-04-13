"""Constants and configuration for fptest scoring and detection."""

# Scoring

SEVERITY_PENALTIES: dict[str, int] = {
    "critical": 25,
    "high": 15,
    "medium": 5,
    "low": 2,
}

CONSISTENCY_WEIGHTS: dict[str, int] = {
    "platform": 12,
    "timezone": 10,
    "webgl": 10,
    "hardware": 10,
    "language": 8,
    "codecs": 8,
    "screen": 4,
    "webrtc": 6,
    "intl": 6,
    "css": 4,
    "storage": 6,
    "permissions": 4,
}

CONSISTENCY_DEDUCTION_PER_ISSUE = 15

BOT_PROBABILITY_STEEPNESS = 0.08
BOT_PROBABILITY_MIDPOINT = 30

# Fingerprint

DICE_THRESHOLD = 0.6
HAMMING_BITS_THRESHOLD = 32

FEATURES: list[str] = [
    "navigator",
    "prototypes",
    "chromium",
    "math",
    "errors",
    "connection",
    "uibars",
    "screen",
    "clientRects",
    "storage",
    "permissions",
    "plugins",
    "codecs",
    "fonts",
    "webgl",
    "webgpu",
    "multimediaDevices",
    "capabilities",
    "inputDevices",
    "battery",
    "orientation",
    "deviceOrientation",
    "sensors",
    "audio",
    "canvas",
    "cssFeatures",
    "tls",
    "lies",
    "headless",
    "intl",
    "svg",
    "windowKeys",
    "worker",
    "webrtc",
    "resistance",
]

STABLE_HASH_FEATURES: set[str] = {
    "fonts",
    "canvas.shapes",
    "canvas.gradient",
    "canvas.webgl",
    "navigator.min",
    "screen.min",
    "math",
    "errors",
    "codecs",
    "webgl",
}

# Detection

AUTOMATION_PREFIXES: tuple[str, ...] = (
    "cdc_",
    "$cdc_",
    "$wdc_",
    "__webdriver",
    "__selenium",
    "__driver",
    "__fxdriver",
    "_Selenium",
    "__nightmare",
    "__playwright",
    "__pw_",
)

AUTOMATION_EXACT: set[str] = {
    "callSelenium",
    "_phantom",
    "callPhantom",
    "domAutomation",
    "domAutomationController",
    "_selenium",
    "__playwright",
    "playwright",
}

PRIVACY_EXPECTED_SIGNALS: set[str] = {
    "no_plugins",
    "canvas_noise",
    "no_webrtc",
    "iframe_proxy",
    "audio_sample_mismatch",
    "audio_all_unique",
    "no_web_share",
    "api_lies",
    "no_content_index",
    "no_contacts_manager",
    "pdf_viewer_disabled",
}

# Consistency

COMMON_DPRS: list[float] = [0.8, 1, 1.25, 1.3, 1.33, 1.5, 1.75, 2, 2.25, 2.5, 2.625, 2.75, 3, 3.5, 4]

VALID_DEVICE_MEMORY: list[float] = [0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128]
