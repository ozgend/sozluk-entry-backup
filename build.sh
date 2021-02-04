#! /bin/bash

npm install --silent
lerna run ui:build --stream
lerna run ui:publish --stream
