<template lang="pug">
.wra
  .minimized(v-if="appMinimized")
    button.window-control-button.minimize(@click="unminimizeApp")
  slot(v-else)
</template>

<script>
import UIStateMixin from '@/mixins/UIStateMixin'
export default {
  name: 'MinimizedWrapper',
  mixins: [UIStateMixin],
}
</script>


<style lang="scss" scoped>
.minimized {
  -webkit-app-region: drag;
  width: 100%;
  height: 100%;
  display: flex;
  button {
    -webkit-app-region: no-drag;
    margin: auto;
  }
}
</style>
