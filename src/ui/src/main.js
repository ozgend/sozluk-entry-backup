import Vue from "vue";
import App from "./App.vue";
import VueSocketIoExt from "vue-socket.io-extended";
import io from "socket.io-client";

const wsUrl = `ws://${process.env.VUE_APP_API_HOST || location.host}`;
const socket = io(wsUrl);
Vue.use(VueSocketIoExt, socket);

console.log(`wsUrl: ${wsUrl}`);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");