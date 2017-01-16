#! /bin/bash

if [ -z "$BINTRAY_USER" ]; then
  echo "you should export BINTRAY_USER environment variable"
  exit 1
fi

if [ -z "$BINTRAY_KEY" ]; then
  echo "you should export BINTRAY_KEY environment variable"
  exit 1
fi

docker build -t fmcp-client .
docker run -e BINTRAY_USER=$BINTRAY_USER -e BINTRAY_KEY=$BINTRAY_KEY -v "$(pwd)":/build fmcp-client
