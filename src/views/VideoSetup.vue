<template lang="pug">
DefaultMinimizedWrapper.setup-wrapper
  h1(v-if="!appMinimized") Select your source
  .source-wrapper.scrollable-x(v-if="!appMinimized")
    .sources
      .source.card.selectable(v-for="source in sources" @click="selectDesktopSource(source.id)")
        img.thumbnail( :alt="source.id" :src="source.thumbnail.toDataURL()")
        .title {{ source.name }}
  
</template>

<script>

import DesktopStreamMixin from '@/mixins/DesktopStreamMixin';
import UIStateMixin from '@/mixins/UIStateMixin'
import DefaultMinimizedWrapper from '@/components/DefaultMinimizedWrapper';

export default {
  name: 'VideoSetup',
  mixins: [ DesktopStreamMixin, UIStateMixin ],
  components: {
    DefaultMinimizedWrapper
  },
  data() {
    return {
      sources: [],
      selectedSource: null,
    }
  },

  async mounted() {
    this.sources = await this.getDesktopSources();
  },

  methods: {},
}
</script>

<style lang="scss" scoped>
.source-wrapper {
  flex: 1 1 0;
  overflow: hidden;
  overflow-x: auto;
  .sources {
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin: 0 auto;

    width: fit-content;

    .source {
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
        filter: grayscale(0.1) brightness(0.6);
      }

      .title {
        position: relative;
        font-size: 3rem;
        font-weight: 800;
        width: 100%;
        text-align: left;
        margin: 1em 0.5em 1em 0.5em;

        color: #fff;
      }
    }
  }
}
</style>