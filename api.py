from flask import Flask, request, render_template, Response
from werkzeug import secure_filename
import os
import sys
import hashlib
import time
import ipfsapi
import json

app = Flask(__name__)
UPLOAD_FOLDER = './uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER 
api = ipfsapi.connect('https://ipfs.infura.io', 5001)
infuraBaseUrl = 'https://ipfs.infura.io/ipfs/'

def genHash(address, BUF_SIZE = 65536):
    sha256 = hashlib.sha256()
    with open(address, 'rb') as f:
        while True:
            data = f.read(BUF_SIZE)
            if not data:
                break
            sha256.update(data)

    return sha256.hexdigest()

@app.route('/')
def hello_world():
    return render_template("index.html", title = 'Index')

@app.route('/upload')
def upload():
   return render_template("upload.html", title = 'Index')
	
@app.route('/uploader', methods = ['GET', 'POST'])
def upload_file():
   if request.method == 'POST':
      f = request.files['file']
      name  = str(int(time.time()))
      ext = str(f.filename).split(".")[-1]
      path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(name)+"."+ext)
      f.save(path)
      res = api.add(path)
      data = {
         'url'  : str(infuraBaseUrl + res['Hash']),
      }
      js = json.dumps(data)

      resp = Response(js, status=200, mimetype='application/json')
   return resp

if __name__ == '__main__':
    from argparse import ArgumentParser

    parser = ArgumentParser()
    parser.add_argument('-p', '--port', default=5000, type=int, help='port to listen on')
    args = parser.parse_args()
    port = args.port

    app.run(host='127.0.0.1', port=port)