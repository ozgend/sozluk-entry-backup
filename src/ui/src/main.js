import Vue from 'vue';
import App from './App.vue';
import VueSocketIO from 'vue-socket.io'
import SocketIO from 'socket.io-client'

Vue.config.productionTip = false;

const socketConnection = SocketIO('http://localhost:4040', {

});

const socket = new VueSocketIO({
  debug: true,
  connection: socketConnection
});

Vue.use(socket);

new Vue({
  render: h => h(App),
}).$mount('#app');
