import json
from datetime import datetime
from flask import Blueprint, request, jsonify

import fingerprint


fingerprint_router = Blueprint('fptest', __name__)

def headers_to_dict(headers):
    # Convert Headers object into plain dict (for JSON injection)
    return {k: v for k, v in headers.items()}

@fingerprint_router.route('/calculate', methods=['POST', 'GET'])
def calculate_fingerprint():
    data = request.json 
    dt =  datetime.now()
    data['headers'] = headers_to_dict(request.headers),

    # compute features & hashes
    features = fingerprint.extract_features(data)
    feature_hashes = fingerprint.compute_hashes(features)
    combined_hash, stable_keys = fingerprint.compute_combined_stable_hash(feature_hashes)

    meta = {
        "timestamp": dt.isoformat() + "Z",
        "visitor_id": combined_hash,
        "stable_features": stable_keys,
        "feature_hashes": feature_hashes,
    }

    return jsonify({"data": data, "metadata": meta })
