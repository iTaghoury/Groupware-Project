import Vue from 'vue'
import App from './App.vue'
import VueSocketIO from 'vue-socket.io'
import SocketIO from 'socket.io-client'

Vue.config.productionTip = false

const socketConnection = SocketIO('http://localhost:5000/', { transports : ['websocket'] });

Vue.use(new VueSocketIO({
  debug: true,
  connection: socketConnection,
  vuex: {
    actionPrefix: 'SOCKET_',
    mutationPrefix: 'SOCKET_'
  }
}))

new Vue({
  render: h => h(App),
}).$mount('#app')
