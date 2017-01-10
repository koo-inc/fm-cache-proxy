const request = require('request-promise');
const crypto = require('crypto');

class Agent {
  constructor(opt) {
    this._secretKey = opt.secretKey;
    this._iv = opt.iv;
  }
  decodeParam(query) {
    let decipher = crypto.createDecipheriv("AES-128-CBC", new Buffer(this._secretKey), new Buffer(this._iv));

    let decrypted = decipher.update(query, 'base64', 'utf8') + decipher.final('utf8');
    return JSON.parse(decrypted);
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
    return {
      'Content-Length': stat.size,
      'Content-Type': stat.contentType,
      'ETag': stat.etag,
      'Last-Modified': stat.lastModified
    };
  }
}

module.exports = Agent;
