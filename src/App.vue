<template lang="pug">
#app(:class="appClass")
  AppControl
  RouterView.wrap-main
  //- KeyboardSelect.wrap-main(v-if="showKeyboardSelect")
  
  //- .wrap-main(v-if="showKeyboardPreview")
  //-   h1 Keyboard
  //-   .kbd-wrapper
  //-     .key(v-for="key in keys" :style="makeKeyStyle(key)")
  //-       .label {{ key.label.replace('KC_', '') }}

  //- .wrap-main(v-if="!selectedSource")
  //-   h1 Select your source
  //-   .source-wrapper.scrollable-x
  //-     .sources
  //-       .source.card.selectable(v-for="source in sources" @click="selectSource(source.id)")
  //-         img.thumbnail( alt="Vue Logo" :src="source.thumbnail.toDataURL()")
  //-         .title {{ source.name }}
  //- .wrap-main(v-if="selectedSource")
  
  

</template>

<script>


import { generateMap } from '@/lib/libMap'
const keysize_px = 31;


import AppControl from '@/components/AppControl'
import UIStateMixin from '@/mixins/UIStateMixin'

// const frameRate = 50;

export default {
  name: 'App',
  mixins: [ UIStateMixin ],
  components: {
    AppControl,
  },
  data() {
    return {
      sources: [],
      selectedSource: null,
      device: null,
      rgbData: [],

      // Keyboard display specifics
      keys: [],
      gmmkMap: null,
      keyMatrix: null,
      kbd_bitmap_size: null,
      showKeyboardPreview: false,

      videoStreamSize: null,
      canvasResolution: [],

      gl: null,
      renderInterval: null,
      shaderProgram: null,
      framebuffer: null,

      sigma: 0.1,

      screenResolution: null,
      screenResDivider: 1,
      
      pixelBuffer: null,

      GMMKIf: null,

      iter: 0,
    }
  },
  async mounted() {

    // generate and save keymap
    const { allKeys, combinedMatrix, kbd_bitmap_size, gmmk_keymap } = generateMap();
    this.keys = allKeys;
    this.keyMatrix = combinedMatrix;
    this.kbd_bitmap_size = kbd_bitmap_size;
    this.gmmkMap = gmmk_keymap;
  },

  computed: {
    appClass() {
      if(this.appMinimized) return 'transparent';
      return '';
    }
  },
  methods: {

    // for kbd-preview
    makeKeyStyle(key) {
      return {
        position: 'absolute',
        left: `${key.x * keysize_px}px`,
        top: `${key.y * keysize_px}px`,
        width: `${key.w * keysize_px}px`,
        height: `${key.h * keysize_px}px`,
      }
    },

    selectSource(id) {
      const source = this.sources.find(s => s.id === id);
      this.selectedSource = source;

      this.$nextTick(this.setupSource);
    },

    


  },
  beforeDestroy() {
    clearInterval(this.renderInterval)
    // clearTimeout(this.renderInterval)
  }
}
</script>

<style lang="scss">

// Import global styles
@import "styles/root";

// Import fonts
@import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300;400;700&display=swap');

body {
  margin: 0;
  height: 100vh;
  width: 100vw;
  
  user-select: none;
}

#app {
  font-family: 'Montserrat', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
  width: 100vw;

  display: flex;
  flex-direction: column;

  background: #fefefe;

  border-radius: 8px;
  overflow: hidden;

  &.transparent {
    background: transparent;

    border-radius: 0px 0px 8px 0px;
  }
}

.wrap-main {
  flex: 1 1 0;

  display: flex;
  flex-direction: column;

  .video-container {
    flex: 1 1 0;
    width: 100%;
    overflow: hidden;
    display: flex;

    video,
    canvas {
      width: 80%;
      margin: auto;
    }
  }
}

.hidden {
  display: none;
}


h1 {
  margin-left: 1em;
  text-align: left;
  font-weight: 900;
  font-size: 3rem;
}

.kbd-wrapper {
  flex: 1 1 0;
  position: relative;
  font-size: 0.5rem;

  .key {
    border: 1px solid rgba(0, 0, 0, 0.2);
    display: flex;
    .label { margin: auto; }
  }
}

</style>
