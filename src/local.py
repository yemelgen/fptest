from flask import Flask, send_from_directory

from endpoints import fingerprint_router


app = Flask(__name__, static_folder='static')
app.register_blueprint(fingerprint_router, url_prefix='/api/fptest')

@app.route("/")
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8008, debug=True)
