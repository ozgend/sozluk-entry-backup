import Vue from "vue";
import App from "./App.vue";
import VueSocketIoExt from "vue-socket.io-extended";
import io from "socket.io-client";

const socket = io("ws://localhost:4040");
Vue.use(VueSocketIoExt, socket);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");