# sozluk-entry-backup
kullanicinin sozluk profil sayfasinda yer alan entryleri yedekleyen bir crawler. 


### todo
- ssr html output (opt. vue-ssr)
- pdf output (opt. pdfkit)
- pause/resume option

### local run / compose
```bash
docker-compose -f docker-compose.local.yml run
```

### local run / vue-serve

```bash
npm install
yarn install
yarn ui:serve
yarn service:serve
```

### local run / vue-compiled 

```bash
npm install
yarn install
yarn ui:build && yarn ui:deploy
yarn service:serve
```

### build + deploy to heroku
```bash
yarn ui:build && yarn ui:deploy
cd ./src/service
heroku container:push web
heroku container:release web
```

---

*bu uygulamanın sözlük oluşumları ile resmi bir bağı yoktur. uygulama kullanılarak elde edilebilecek internete açık verilerin, ilgili kullanıcılara ya da platformlara karşı yasal bir bağlayıcılığı bulunmamaktadır.*
