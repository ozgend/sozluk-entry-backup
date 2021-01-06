#! /bin/bash

npm install --production --silent
lerna run ui:build --stream
lerna run ui:publish --stream
