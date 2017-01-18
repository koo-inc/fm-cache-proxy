let http = require('http');
let Minio = require('minio');

class Client extends Minio.Client {
  getRequestOptions(opts) {
    let param = super.getRequestOptions(opts);
    param.agent = new http.Agent({keepAlive: false});
    return param;
  }
}

module.exports = Client;
