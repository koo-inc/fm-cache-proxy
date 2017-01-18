require('zone.js');
const crypto = require('crypto');
const _ = require('lodash');
const Client = require('./client');

const root = Zone.current;

function callback(resolve, reject) {
  return (err, val) => {
    if (err) {
      reject(err);
    }
    else {
      resolve(val);
    }
  };
}

class Storage {
  constructor(opt, agent) {
    this._agent = agent;
    this._bucketName = opt.bucketName;
    this._region = opt.region;
    this._client = new Client(_.pick(opt, ['endPoint', 'port', 'secure', 'accessKey', 'secretKey']));
  }
  exists(key) {
    return this._ensureBucket().then(() => {
      return new Promise((resolve, reject) => {
        return this._client.statObject(this._bucketName, this._agent.generateUniqueKey(key), callback(resolve, reject))
      });
    });
  }
  fetch(key) {
    return this._ensureBucket().then(() => {
      return new Promise((resolve, reject) => {
        return this._client.getObject(this._bucketName, this._agent.generateUniqueKey(key), callback(resolve, reject))
      });
    });
  }
  put(key, data, size, contentType) {
    return this._ensureBucket().then(() => {
      return new Promise((resolve, reject) => {
        if (!this._isReadableStream(data)) {
          contentType = size;
          return this._client.putObject(this._bucketName, this._agent.generateUniqueKey(key), data, contentType, callback(resolve, reject));
        }
        else {
          return this._client.putObject(this._bucketName, this._agent.generateUniqueKey(key), data, size, contentType, callback(resolve, reject));
        }
      });
    });
  }
  remove(key) {
    return new Promise((resolve, reject) => {
      console.log('remove file ' + this._agent.generateUniqueKey(key));
      return this._client.removeObject(this._bucketName, this._agent.generateUniqueKey(key), callback(resolve, reject));
    })
  }
  removeLazy(key, expire) {
    root.fork({
      name: 'remove-lazy',
      onHandleError: (e) => console.log(e)
    }).run(() => {
      setTimeout(() => this.remove(key), expire * 1000);
    });
  }
  _ensureBucket() {
    return new Promise((resolve, reject) => {
      if (this._created) {
        resolve();
        return;
      }
      return this._client.bucketExists(this._bucketName, err => {
        if (!err) {
          console.log('exists bucket ' + this._bucketName);
          this._created = true;
          resolve();
          return;
        }
        this._client.makeBucket(this._bucketName, this._region, err => {
          if (!err) {
            console.log('create bucket ' + this._bucketName);
            this._created = true;
            resolve();
            return;
          }
          console.log('cannot create bucket ' + this._bucketName + ' : ' + err);
          reject(err);
        })
      })
    });
  }
  _isReadableStream(obj) {
    return obj != null && typeof obj._read == 'function';
  }
}

module.exports = Storage;
