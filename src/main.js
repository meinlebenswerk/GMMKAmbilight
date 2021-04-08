import Vue from 'vue'
import App from './App.vue'

import store from './store';

import GMMKPlugin from '@/plugins/GMMKPlugin'
import router from './router'

// globally install the GMMK Plugin
Vue.use(GMMKPlugin);

Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App),
  router,

  mounted() {
    // run on mount cleanup:
    this.$store.dispatch('resetKeyboard');
  }
}).$mount('#app')
