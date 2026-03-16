from flask import Flask

from endpoints import fingerprint_router

app = Flask(__name__)
app.register_blueprint(fingerprint_router, url_prefix="/api")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8001, debug=False)
