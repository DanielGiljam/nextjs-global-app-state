#!/usr/bin/env bash

rm -rf lib
tsc -p tsconfig.build.json
cp package.build.json lib/package.json
cp README.md CHANGELOG.md LICENSE withGlobalAppState.js lib
