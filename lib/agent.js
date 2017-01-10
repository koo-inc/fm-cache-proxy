const request = require('request-promise');
const crypto = require('crypto');
const _ = require('lodash');

class Agent {
  constructor(opt) {
    this._secretKey = opt.secretKey;
    this._iv = opt.iv;
    this._forceDownload = opt.forceDownload != null ? opt.forceDownload : true;
  }
  decodeParam(query) {
    let decipher = crypto.createDecipheriv("AES-128-CBC", new Buffer(this._secretKey), new Buffer(this._iv));

    let decrypted = decipher.update(query, 'base64', 'utf8') + decipher.final('utf8');
    return _.omit(JSON.parse(decrypted), ['_']);
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
