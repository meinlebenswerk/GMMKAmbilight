<template lang="pug">
DefaultMinimizedWrapper.component-wrapper
  h1 Select your keyboard
  .device-select-wrapper.scrollable-x
    .devices
      .device.card.selectable(v-for="fingerprint in deviceFingerprints" @click="selectDevice(fingerprint.device)")
        img.thumbnail( alt="Vue Logo" :src="fingerprint.image")
        .title {{ fingerprint.title }}

</template>

<script>

// Todo either confirm or something
// I could make the device blink before selecting it, so you can make sure you select
// the right one.

import GMMK_Image from '@/assets/GMMK_TKL.png'

import keyboardStateMixin from '@/mixins/keyboardStateMixin'

import DefaultMinimizedWrapper from '@/components/DefaultMinimizedWrapper';

export default {
  name: 'KeyboardSelector',
  mixins: [keyboardStateMixin],
  components: {
    DefaultMinimizedWrapper
  },
  data() {
    return {
      devices: [],
      deviceFingerprints: []
    }
  },
  mounted() {
    this.devices = this.$gmmkInterface.devices;
    this.deviceFingerprints = this.devices.map(this.deviceFingerprint)

    if(this.keyboardInitialized) {
      this.$router.push({ name: 'VideoSetup' })
    }
  },
  methods: {
    // Built with the IDs found in the rgb-keyboard https://github.com/dokutan/rgb_keyboard
    deviceFingerprint(device) {
      const { productId } = device;
      switch(productId) {
        case 0x652f: 
          return {
            // title: 'Tecware Phantom RGB TKL or Glorious GMMK full-size ANSI and TKL ANSI',
            title: "GMMK",
            image: GMMK_Image,
            device,
          };
        case 0x7903:
          return {
            title: 'Ajazz AK33',
            image: GMMK_Image,
            device,
          };
        case 0x5204:
          return {
            title: 'Redragon K550 Yama',
            image: GMMK_Image,
            device,
          };
        case 0x5004:
          return {
            title: 'Redragon K556 Devarajas or Redragon K587 PRO Magic Wand or Redragon Mitra RGB',
            image: GMMK_Image,
            device,
          };
        case 	0x5104:
          return {
            title: 'Redragon K552 Kumara',
            image: GMMK_Image,
            device,
          };
        case 0x8520:
          return {
            title: 'Warrior Kane TC235',
            image: GMMK_Image,
            device,
          };
        default:
          return {
            title: 'unknown',
            image: GMMK_Image,
            device,
          };
      }
    },

    selectDevice(device) {
      // this.$gmmkInterface.selectDevice(device);
      this.$store.dispatch('selectKeyboard', device)
      .then(() => this.$store.dispatch('intializeKeyboard'))
      .then(() => this.$router.push({ name: 'VideoSetup' }))
    }
  }
}
</script>

<style lang="scss" scoped>
.device-select-wrapper {
  flex: 1 1 0;
  overflow: hidden;
  overflow-x: auto;
  .devices {
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin: 0 auto;

    width: fit-content;

    .device {
      max-height: 45vw;
      display: inline-block;
      margin: auto 3rem;

      overflow: hidden;

      position: relative;
      height: 80%;
      width: 300px;

      .thumbnail {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;

        object-fit: cover;
        z-index: 1;

        filter: grayscale(0.1) brightness(0.6);
      }

      .title {
        font-size: 3rem;
        font-weight: 800;
        width: 100%;
        background: rgba($color: #fff, $alpha: 0.6);
        text-align: left;
        margin: 1em 0.5em 1em 0.5em;
      }
    }
  }
}
</style>
