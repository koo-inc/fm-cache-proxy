require('zone.js');
const http = require('http');
const url = require('url');
const Storage = require('./storage');
const Agent = require('./agent');

class Server {
  constructor(config) {
    this._config = config;
    this._server = http.createServer(this._handleRequest.bind(this));
    this._agent = new Agent(config.agent);
    this._storage = new Storage(config.storage, this._agent);
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
      if (req.method.toLowerCase() == 'put') {
        return this._handlePutRequest(req, res);
      }
      else {
        return this._handleGetRequest(req, res);
      }
    });
  }
  _handleGetRequest(req, res) {
    let param = this._agent.decodeParam(req.url);
    return this._sendFileFromStorageIfExists(res, param).catch(() => {
      return this._agent.fetch(param).then(fileRes => {
        return this._storage.put(param, fileRes.body, fileRes.headers['content-type'])
          .then(() => {
            if (this._config.expire > 0) {
              this._storage.removeLazy(param, this._config.expire);
            }
          })
          .then(() => this._sendFileFromStorageIfExists(res, param))
      })
    });
  }
  _handlePutRequest(req, res) {
    let param = this._agent.decodeParam(req.url);
    return this._storage.put(param, req, parseInt(req.headers['content-length']), req.headers['content-type'])
      .then(() => {
        if (this._config.expire > 0) {
          this._storage.removeLazy(param, this._config.expire);
        }
      })
      .then(() => this._sendNoContent(res))
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
  _sendNoContent(res) {
    res.writeHead(204);
    res.end();
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

