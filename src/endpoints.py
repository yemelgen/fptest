from datetime import datetime

from flask import Blueprint, jsonify, request

import consistency
import detection
import fingerprint
import scoring

fingerprint_router = Blueprint("fptest", __name__)


def headers_to_dict(headers):
    # Convert Headers object into plain dict (for JSON injection)
    return {k: v for k, v in headers.items()}


@fingerprint_router.route("/calculate", methods=["POST", "GET"])
def calculate_fingerprint():
    try:
        data = request.json
        dt = datetime.now()
        data["headers"] = headers_to_dict(request.headers)

        features = fingerprint.extract_features(data)
        feature_hashes = fingerprint.compute_hashes(features)
        combined_hash, stable_keys = fingerprint.compute_combined_stable_hash(feature_hashes)

        detection_result = {
            "engine": detection.detect_engine(data),
            "platform": detection.detect_platform(data),
            "bot_signals": detection.detect_bot_signals(data),
        }
        consistency_result = consistency.run_all_consistency_checks(data)
        scoring_result = scoring.compute_authenticity_score(data, features, detection_result, consistency_result)

        meta = {
            "timestamp": dt.isoformat() + "Z",
            "visitor_id": combined_hash,
            "stable_features": stable_keys,
            "feature_hashes": feature_hashes,
            "detection": detection_result,
            "consistency": consistency_result,
            "scoring": scoring_result,
        }

        return jsonify({"data": data, "metadata": meta})
    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
