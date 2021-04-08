

<template lang="pug">
.app-header(v-if="!appMinimized")
  .window-controls
    .drag-region
    button.window-control-button.minimize(@click="minimizeApp" v-if="showMinimizeButton")
    button.window-control-button.close(@click="closeWindow")
</template>

<script>

import { ipcRenderer } from 'electron';
import UIStateMixin from '@/mixins/UIStateMixin'
export default {
  name: 'AppControl',
  mixins: [ UIStateMixin ],
  computed: {
    currentRoute() {
      return this.$route.name;
    },
    showMinimizeButton() {
      return this.currentRoute === 'VideoStreamer';
    }
  },
  methods: {
    closeWindow() {
      ipcRenderer.invoke('close');
    }
  },
}
</script>

<style lang="scss" scoped>
.app-header {
  
  width: 100%;

  .window-controls {
    display: flex;
    justify-content: flex-end;
    padding: 0.5rem 1rem;
    background: #eeeeee;

    .drag-region {
      -webkit-app-region: drag;
      flex: 1 1 0;
      justify-self: flex-start;
    }
  }
}
</style>
