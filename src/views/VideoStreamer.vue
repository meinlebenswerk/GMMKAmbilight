<template lang="pug">
.streamer-wrapper(:class="wrapperClass")
  .minimized-controls(v-if="appMinimized")
    .text GMMK Ambilight
    .info-bar
      .hover-content 
        .text show controls
        unminimizeIcon(:size="16" @click="unminimizeApp")
  h1(v-if="!appMinimized") Ambilight Preview
  .controls(v-if="!appMinimized")
    .control(@click="stopStream")
      StopIcon.icon(:size="36") 
      .name Stop Stream
    .control
      input(type="range" min="0" max="1000" v-model="sigma_slider")
      .name blur-sigma
  .video-container
    video.hidden(ref="videoPreview")
    canvas.card(ref="previewCanvas")
    //- 
      //- button.window-control-button.minimize(@click="unminimizeApp")
</template>

<script>
import UIStateMixin from '@/mixins/UIStateMixin'

import StopIcon from 'vue-material-design-icons/Stop.vue';
import unminimizeIcon from 'vue-material-design-icons/ExportVariant.vue'

import { GMMK_MAX_KEY } from '@/plugins/GMMKPlugin'
import blur_frag_shader from '!raw-loader!@/shaders/blur.frag'
import blur_vert_shader from '!raw-loader!@/shaders/blur.vert'

import { generateMap } from '@/lib/libMap'

import { createShader, createTexture } from '@/lib/libGL';

const SIGMA_MIN = 0.05;
const SIGMA_MAX = 5.0;


export default {
  name: 'VideoStreamer',
  mixins: [ UIStateMixin ],
  components: {
    StopIcon,
    unminimizeIcon
  },


  data() {
    return {
      videoStreamSize: null,
      sigma: 0.1,

      keys: null,
      keyMatrix: null,
      kbd_bitmap_size: null,
      gmmkMap: null,

      screenResDivider: 0,

      isStreaming: true,
    }
  },

  mounted() {
    if(!this._checkRequirements()) return;

    const { allKeys, combinedMatrix, kbd_bitmap_size, gmmk_keymap } = generateMap();
    this.keys = allKeys;
    this.keyMatrix = combinedMatrix;
    this.kbd_bitmap_size = kbd_bitmap_size;
    this.gmmkMap = gmmk_keymap;
  },

  computed: {
    wrapperClass() {
      let classList = '';

      if(this.appMinimized) {
        classList += 'minimized ';
      }

      return classList;
    },

    sigma_slider: {
      get() {
        const range = SIGMA_MAX - SIGMA_MIN;
        return ((this.sigma-SIGMA_MIN) / range) * 1000;
      },
      set(val) {
        const range = SIGMA_MAX - SIGMA_MIN;
        this.sigma = SIGMA_MIN + (val/1000)*range;
      }
    },

    screenResolution() {
      return this.$store.getters.screenResolution;
    },
    screenResolutionDivider() {
      return this.$store.getters.screenResolutionDivider;
    },
    selectedSourceId() {
      return this.$store.getters.selectedSourceId;
    }
  },
  methods: {

    stopStream() {
      this.isStreaming = false;
    },

    shutdown() {
      const previewRef = this.$refs.videoPreview;
      for(const track of previewRef.srcObject.getTracks()) {
        track.stop();
      }
      previewRef.srcObject = null;
      this.$router.push({ name: 'VideoSetup' });
    },


    _checkRequirements() {
      if(!this.$store.getters.keyboardInitialized) {
        this.$router.push({ name: 'KeyboardSelect' });
        return false;
      }

      if(this.$store.getters.selectedSourceId  === -1) {
        this.$router.push({ name: 'VideoSetup' });
        return false;
      }
      
      return true;
    },

    _initStream() {
      // Some vars need to be calculated before we can begin:
      this.screenResDivider = this.$store.getters.screenResolutionDivider;

      // find optimal divider based on the keyboard-resolution
      // Which still fits the aspect-ratio (of the screen)
      while(this.screenResolution.height/this.screenResDivider < this.kbd_bitmap_size.y) {
        this.screenResDivider /= 2;
      }

      this.setupSource();
    },

    async setupSource() {
      const videoHeight = this.screenResolution.height / (this.screenResolutionDivider / 64);
      const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: this.selectedSourceId,
              minHeight: videoHeight,
              maxHeight: videoHeight,
            }
          }
        })
      
      const previewRef = this.$refs.videoPreview;

      // get the stream's video track
      const videoTrack = stream.getTracks()[0];
      const { width, height } = videoTrack.getSettings();

      // const previewSize = previewRef.getBoundingClientRect();
      // console.log(width, height, previewSize)

      this.videoStreamSize = { width, height };
    
      previewRef.srcObject = stream;
      previewRef.onloadedmetadata = () => {
        previewRef.play()
        setTimeout(this.webgl_process_frame, 200)
      }
    },


    init_webGL() {
      const video = this.$refs.videoPreview;
      if(!this.gl) {
        const canvas = this.$refs.previewCanvas;
        canvas.width = this.kbd_bitmap_size.x;
        canvas.height = this.kbd_bitmap_size.y;


        // IDK maybe this helps
        // canvas.transferControlToOffscreen();

        this.canvasResolution = [canvas.width, canvas.height];
        // this.gl = canvas.getContext('webgl');
        this.gl = canvas.getContext("webgl");
      }
      const gl = this.gl;

      const vertexShader = createShader(gl, blur_vert_shader, 'vert');
      const fragmentShader = createShader(gl, blur_frag_shader, 'frag');

      this.shaderProgram = gl.createProgram();
      gl.attachShader(this.shaderProgram, vertexShader);
      gl.attachShader(this.shaderProgram, fragmentShader);
      gl.linkProgram(this.shaderProgram);
      
      /*========== Defining and storing the geometry =========*/

      const vertexArray = new Float32Array([
        -1, 1,
        -1, -1,
        1, -1,
        1, 1,
      ])

      const uv = new Float32Array([
        0, 0,
        0, 1,
        1, 1,
        1, 0
      ])

      const indices = [3, 2, 1, 3, 1, 0];
      this.shaderProgram.nIndices = indices.length;

      // Create an empty buffer object to store vertex buffer
      this.shaderProgram.vertexBuffer = this.gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.shaderProgram.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);


      // Create UV Buffer
      this.shaderProgram.UVBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.shaderProgram.UVBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
      
      // Create an empty buffer object to store Index buffer
      this.shaderProgram.IndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.shaderProgram.IndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

      // create video texture:
      this.shaderProgram.videoTexture = createTexture(gl, video);
    },


    // GL Post-processing
    webgl_process_frame() {
      // console.log('processing webgl frame')
      const video = this.$refs.videoPreview;
      const canvas = this.$refs.previewCanvas;
      if(!this.gl) this.init_webGL();
      const gl = this.gl;
      gl.useProgram(this.shaderProgram);

      /*====================== Shaders =======================*/
      


      /* ======= Associating shaders to buffer objects =======*/

      // Bind vertex buffer object
      gl.bindBuffer(gl.ARRAY_BUFFER, this.shaderProgram.vertexBuffer);
      const vertexBufferCoord = gl.getAttribLocation(this.shaderProgram, 'coordinates');
      gl.vertexAttribPointer(vertexBufferCoord, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexBufferCoord);

      // Bind uv buffer object
      gl.bindBuffer(gl.ARRAY_BUFFER, this.shaderProgram.UVBuffer);
      const uvBufferCoord = gl.getAttribLocation(this.shaderProgram, 'uv_coordinates');
      gl.vertexAttribPointer(uvBufferCoord, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(uvBufferCoord);

      // Bind index buffer object
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.shaderProgram.IndexBuffer);


      // Bind the texture:
      // Tell WebGL we want to affect texture unit 0
      gl.uniform1i(gl.getUniformLocation(this.shaderProgram, 'uSampler'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.shaderProgram.videoTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

      // bind the resolution uniform:
      gl.uniform2f(gl.getUniformLocation(this.shaderProgram, 'resolution'), ...this.canvasResolution);

      // construct gaussian kernel

      const linspace = (a,b,n) => {
        const step = (b - a) / (n - 1);
        return new Array(n).fill(1).map((e, i) => a + (i)*step);
      }
      const kernel_size = 16
      const sigma = this.sigma;
      const kernel = linspace(-1, 1, kernel_size).map((x) => (1/(sigma * Math.sqrt(2 * Math.PI)))* Math.exp(-0.5 * (x**2/sigma**2)));

      gl.uniform1fv(gl.getUniformLocation(this.shaderProgram, 'kernel'), kernel); 

      /*============= Drawing the Quad ================*/

      // Clear the canvas
      gl.clearColor(0.5, 0.5, 0.5, 0.9);
      gl.enable(gl.DEPTH_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.drawElements(gl.TRIANGLES, this.shaderProgram.nIndices, gl.UNSIGNED_SHORT, 0);

      setImmediate(this.download_image)
    },

    // image -> kbd interface:
    download_image() {
      // console.log('downloading frame')
      const gl = this.gl;

      if(!this.pixelBuffer) {
        this.pixelBuffer = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
      }
      
      // gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, this.pixelBuffer )
      // gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

      const keyColors = new Array(GMMK_MAX_KEY).fill({ r: 0, g: 0, b: 0})

      const sy = this.keyMatrix.length;
      const sx = this.keyMatrix[0].length;

      for(let y=0; y<sy; y++){
        for(let x=0; x<sx; x++){
          const { gmmk_index, center } = this.keyMatrix[y][x];
          if(gmmk_index === -1) continue;
          // const px = Math.floor(x * xstep);
          // const py = Math.floor((sy - y - 1)* ystep);
          const px = Math.floor(center.x * this.kbd_bitmap_size.bitmap_scl_x);
          const py = Math.floor((this.keyMatrix.max_y - center.y) * this.kbd_bitmap_size.bitmap_scl_y);
          const idx = (px + (py * gl.drawingBufferWidth)) * 4;

          keyColors[gmmk_index - 1] = {
            r: this.pixelBuffer[idx],
            g: this.pixelBuffer[idx + 1],
            b: this.pixelBuffer[idx + 2],
          }
        }
      }
      this.$gmmkInterface.setKeys(keyColors);

      // request next frame:
      // this.renderInterval = setTimeout(this.)
      if(this.isStreaming) setImmediate(this.webgl_process_frame);
      else this.shutdown();
    }
  },

  watch: {
    screenResolution(val) {
      if(val) this._initStream();
    }
  },
}
</script>


<style lang="scss" scoped>
.streamer-wrapper {
  position: relative;
  &.minimized {
    -webkit-app-region: drag;
    background: transparent;
    canvas {
      transform: translate(-10000%, -10000%);
    }

    button {
      -webkit-app-region: no-drag;
      margin: auto;
    }
  }
}


.minimized-controls {
  font-family: 'Roboto Condensed', sans-serif;
  font-weight: 700;
  -webkit-app-region: no-drag;
  position: absolute;
  left: 0;
  top: 0;
  min-height: 1rem;
  width: 100%;

  background: #eee;

  .info-bar {
    
    display: block;
    background: #fdd835;
    color: #640d15;
    // width: fit-content;
    padding: 0;
    height: 0;

    .hover-content {
      display: none;
      
      flex-direction: row;
      justify-content: center;

      height: 1.5rem;

      * {
        display: inline-flex;
        margin: auto 0;
      }

      span {      
        svg {
          -webkit-app-region: no-drag;
          cursor: pointer;
          margin: auto;
        }
      }

      .text {
        line-height: 1.5rem;
        margin: auto 1rem;
      }
    }

    transition: all 300ms ease-in-out;
  }

  &:hover > .info-bar, .info-bar:hover {
    display: block;
    position: relative;
    z-index: 1000;
    height: auto;
    margin: 1rem auto 0 auto;

    .hover-content {
      display: flex;
    }
  }
}

.controls {
  font-family: "Roboto condensed", sans-serif;
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin: 0 2rem;

  .control {
    cursor: pointer;
    border: 1px solid rgba(0, 0, 0, 0.2);
    margin: 0 1rem;
    border-radius: 8px;
    width: 5rem;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
  }
}

</style>
