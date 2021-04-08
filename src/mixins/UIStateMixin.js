import { ipcRenderer } from 'electron'

export default {
  computed: {
    appMinimized() {
      return this.$store.getters.isAppMinimized;
    }
  },

  methods: {
    minimizeApp(){
      this.$store.commit('setMinimized', true);
      ipcRenderer.invoke('minimize')
    },
    unminimizeApp(){
      this.$store.commit('setMinimized', false);
      ipcRenderer.invoke('unminimize')
    }
  }
}