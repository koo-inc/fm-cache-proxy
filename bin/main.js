#! /usr/bin/env node

"use strict";

let process = require('process');
let fs = require('fs');

if (process.argv.length < 3) {
  console.log('usage: fmcp /path/to/any/config.json');
  process.exit(1);
}
let config = JSON.parse(fs.readFileSync(process.argv[2]));

let Server = require('../lib/fmcp');
new Server(config).start();
