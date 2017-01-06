# fm-cache-proxy
Freemind Media Cache Proxy

# Install

```
npm i -g github:koo-inc/fm-cache-proxy
```

# Usage

```
fmcp /path/to/config.json
```

## config.json example

```
{
  "port": 8080,
  "expire": 691200,
  "storage": {
    "endPoint": "127.0.0.1",
    "port": 9000,
    "secure": false,
    "accessKey": "OOTK0FUW5SEJ5BZCLVU1",
    "secretKey": "WjZn9SaeFIMzkXYSe4HsHHau4snhFCks5ISEquxD",
    "bucketName": "mybuckets",
    "region": "us-east-1"
  },
  "agent": {
    "secretKey": "abcdefghijklmnop",
    "iv": "1234567890123456"
  }
}
```

see [reference](http://docs.minio.io/docs/javascript-client-api-reference) for `storage` settings.

`agent` parse query token by the symmetric-key cryptography. So you shoud use same `secretKey` and `iv` to generate token by server side.
