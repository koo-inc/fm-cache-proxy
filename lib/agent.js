const request = require('request-promise');
const crypto = require('crypto');
const url = require('url');
const querystring = require('querystring')
const _ = require('lodash');

class Agent {
  constructor(opt) {
    this._secretKey = opt.secretKey;
    this._iv = opt.iv;
    this._forceDownload = opt.forceDownload != null ? opt.forceDownload : true;
    this._uniqueKeys = opt.uniqueKeys;
  }
  decodeParam(requestUrl) {
    let query = decodeURIComponent(url.parse(requestUrl).query);
    let decipher = crypto.createDecipheriv("AES-128-CBC", new Buffer(this._secretKey), new Buffer(this._iv));

    let decrypted = decipher.update(query, 'base64', 'utf8') + decipher.final('utf8');
    let param = _.omit(JSON.parse(decrypted), ['_']);

    let ext = param.url.match(/[^\/]+\.([a-zA-Z0-9]+)$/);
    if (!param.ext && ext) {
      param.ext = ext[1];
    }
    return param;
  }
  generateUniqueKey(param) {
    let keyObject;
    let location = url.parse(param.url);
    if (param.method.toLowerCase() == 'get') {
      keyObject = querystring.parse(location.query);
    }
    else {
      keyObject = param.body;
    }

    if (this._uniqueKeys != null && this._uniqueKeys.length > 0) {
      keyObject = _.pick(keyObject, this._uniqueKeys)
    }

    let shasum = crypto.createHash('sha1');
    shasum.update(location.protocol);
    shasum.update(location.host);
    shasum.update(location.pathname);
    shasum.update(JSON.stringify(this._sort(_.entries(keyObject))));
    return shasum.digest('hex') + (param.ext ? '.' + param.ext : '');
  }
  _sort(list) {
    return list.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  }
  fetch(param) {
    if (param == null || param.url == null) {
      throw Error('url is not specified.');
    }
    let options = {
      url: param.url,
      method: param.method || 'GET',
      resolveWithFullResponse: true,
      encoding: null,
      headers: param.headers
    };
    if ('body' in param && options.method.toLowerCase() === 'post') {
      options.body = param.body;
    }

    return request(options);
  }
  createHead(stat) {
    let header = {
      'Content-Length': stat.size,
      'Content-Type': stat.contentType,
      'ETag': stat.etag,
      'Last-Modified': stat.lastModified
    };
    if (this._forceDownload) {
      header['Content-Type'] = 'application/octet-stream';
      header['Content-Disposition'] = 'attachment';
    }
    return header;
  }
}

module.exports = Agent;
