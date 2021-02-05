# sozluk-entry-backup
kullanicinin sozluk profil sayfasinda yer alan entryleri yedekleyen bir crawler. 

## local run / compose
```bash
docker-compose -f docker-compose.local.yml run
```

## local run / vue-serve

```bash
npm install
yarn install
yarn ui:serve
yarn service:serve

##      ui: http://localhost:3000
## service: http://localhost:4040
```

## local run / vue-compiled 

```bash
npm install
yarn install
yarn ui:build && yarn ui:deploy
yarn service:serve

## app: http://localhost:4040
```

## build + deploy to heroku
```bash
yarn ui:build && yarn ui:deploy
cd ./src/service
heroku container:push web
heroku container:release web
```