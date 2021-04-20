from gevent import monkey
monkey.patch_all()

from gevent.pywsgi import WSGIServer
from api import app
from util import load_conf, check_existing_token

def server():
    cfg = load_conf()
    api_token = check_existing_token()

    http_server = WSGIServer((cfg['backendIP'], int(cfg['backendPort'])), app)
    print("Server started. Running on " + str(cfg['backendIP']) + ":" + str(cfg['backendPort']))
    print("API Token: " + api_token)
    print("Parser IP set to: " + str(cfg['parserIP']) + ":" + str(cfg['parserPort']))
    http_server.serve_forever()