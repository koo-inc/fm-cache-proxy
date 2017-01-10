const crypto = require('crypto');
const Minio = require('minio');
const _ = require('lodash');

function sort(list) {
  return list.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
}

function filenameOf(keyObject) {
  let shasum = crypto.createHash('sha1');
  let entries = sort(_.entries(keyObject));
  shasum.update(JSON.stringify(entries));
  return (keyObject.prefix || '') + shasum.digest('hex') + (keyObject.ext || '');
}

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
  constructor(opt) {
    this._bucketName = opt.bucketName;
    this._region = opt.region;
    this._client = new Minio.Client(_.pick(opt, ['endPoint', 'port', 'secure', 'accessKey', 'secretKey']));
  }
  exists(key) {
    return this._ensureBucket().then(() => {
      return new Promise((resolve, reject) => {
        return this._client.statObject(this._bucketName, filenameOf(key), callback(resolve, reject))
      });
    });
  }
  fetch(key) {
    return this._ensureBucket().then(() => {
      return new Promise((resolve, reject) => {
        this._client.getObject(this._bucketName, filenameOf(key), callback(resolve, reject))
      });
    });
  }
  put(key, stream, stat) {
    stat = stat || {};
    return this._ensureBucket().then(() => {
      return new Promise((resolve, reject) => {
        this._client.putObject(this._bucketName, filenameOf(key), stream, stat.size, stat.contentType, callback(resolve, reject));
      });
    });
  }
  remove(key) {
    return new Promise((resolve, reject) => {
      return this._client.removeObject(this._bucketName, filenameOf(key), callback(resolve, reject));
    })
  }
  _ensureBucket() {
    return new Promise((resolve, reject) => {
      if (this._created) {
        console.log('exists bucket ' + this._bucketName);
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
          console.log('dont create bucket ' + this._bucketName + ' : ' + err);
          reject(err);
        })
      })
    });
  }
}

module.exports = Storage;
