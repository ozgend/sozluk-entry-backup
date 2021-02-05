#! /bin/bash

yarn ui:build && yarn ui:deploy
cd ./src/service
heroku container:push web
heroku container:release web
