import { desktopCapturer, ipcRenderer } from 'electron';


export default {

  methods: {
    async getDesktopSources() {
      return desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 400, height: 400 }});
    },

    async getDisplayInformation(id) {
        const screenResolution = await ipcRenderer.invoke('getPrimaryScreenResolution', id);
        this.$store.commit('updateScreenResoltion', screenResolution);
    },

    selectDesktopSource(id) {
      // get display information by id:
      this.getDisplayInformation(id);
      this.$store.commit('setSelectedSource', id)
      this.$router.push({ name: 'VideoStreamer'})
    }
  }
}