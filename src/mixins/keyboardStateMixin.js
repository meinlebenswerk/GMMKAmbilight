export default {
  computed: {
    keyboardInitialized() {
      return this.$store.getters.keyboardInitialized;
    }
  }
}