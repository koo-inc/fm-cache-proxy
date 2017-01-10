require('zone.js');
const http = require('http');
const url = require('url');
const Readable = require('stream').Readable;
const Storage = require('./storage');
const Agent = require('./agent');

class Server {
  constructor(config) {
    this._config = config;
    this._server = http.createServer(this._handleRequest.bind(this));
    this._storage = new Storage(config.storage);
    this._agent = new Agent(config.agent);
  }

  start() {
    console.log(this._config.port + ' listen start');
    this._server.listen(this._config.port);
  }

  _handleRequest(req, res) {
    Zone.current.fork({
      name: 'fmcp-request',
      onHandleError: (delegate, current, target, e) => this._handleError(res, e),
      properties: {
        request: req,
        response: res,
      },
      onInvoke: (parentZoneDelegate, currentZone, targetZone, delegate, applyThis, applyArgs, source) => {
        try {
          return parentZoneDelegate.invoke(targetZone, delegate, applyThis, applyArgs, source);
        }
        catch (e) {
          this._handleError(res, e);
        }
      }
    }).run(() => {
      if (req.url.match(/\/favicon.ico/)) {
        return this._handleFaviconRequest(res);
      }
      let param = this._agent.decodeParam(decodeURIComponent(url.parse(req.url).query))
      return this._sendFileFromStorageIfExists(res, param).catch(() => {
        return this._agent.fetch(param).then(fileRes => {
          if (this._config.expire > 0) {
            setTimeout(() => this._storage.remove(param), this._config.expire * 1000);
          }
          let stream = new Readable();
          stream.push(fileRes.body, 'binary');
          stream.push(null);

          let stat = {
            size: fileRes.headers['content-length'] ? parseInt(fileRes.headers['content-length']) : undefined,
            contentType: fileRes.headers['content-type']
          };
          return this._storage.put(param, fileRes.body, stat)
            .then(() => this._sendFileFromStorageIfExists(res, param))
        })
      });
    });
  }
  _handleError(res, e) {
    let statusCode = (e.rejection || {}).statusCode || 500;
    let response = (e.rejection || {}).error || '<h1>Internal Server Error</h1>';

    console.log(e.stack);
    res.writeHead(statusCode);
    res.end(response);
  }
  _sendFileFromStorageIfExists(res, param) {
    return this._storage.exists(param).then(stat => {
      return this._sendFileFromStorage(res, param, stat);
    });
  }
  _sendFileFromStorage(res, param, stat) {
    let req = Zone.current.get('request');
    if (stat.etag === req.headers['If-None-Match']) {
      return new Promise(resolve => {
        res.writeHead(304);
        res.end();
        resolve();
      })
    }
    return this._storage.fetch(param).then(fileRes => {
      res.writeHead(200, this._agent.createHead(stat));
      fileRes.pipe(res, 'binary');
      fileRes.on('end', () => res.end());
    });
  }
  _handleFaviconRequest(res) {
    return new Promise(resolve => {
      res.writeHead(404);
      res.end();
      resolve();
    })
  }
}

module.exports = Server;

