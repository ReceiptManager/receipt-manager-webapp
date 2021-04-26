from gevent import monkey
monkey.patch_all()

from gevent.pywsgi import WSGIServer
from api import app
from util import load_conf, check_existing_token

def server():
    cfg = load_conf()
    api_token = check_existing_token()

    if cfg["useSSL"]:
        http_server = WSGIServer(
            (cfg["backendIP"], int(cfg["backendPort"])),
            app,
            certfile="ssl/cert.crt",
            keyfile="ssl/key.pem",
        )
        print(
            "Server started. Running on https://"
            + str(cfg["backendIP"])
            + ":"
            + str(cfg["backendPort"])
        )
    else:
        http_server = WSGIServer((cfg["backendIP"], int(cfg["backendPort"])), app)
        print(
            "Server started. Running on http://"
            + str(cfg["backendIP"])
            + ":"
            + str(cfg["backendPort"])
        )

    print("API Token: " + api_token)
    print("Parser IP set to: " + str(cfg["parserIP"]) + ":" + str(cfg["parserPort"]))
    http_server.serve_forever()
