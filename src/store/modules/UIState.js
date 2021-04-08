const state = {
  minimized: false,
}

const getters = {
  isAppMinimized: state => state.minimized,
}

const mutations = {
  setMinimized(state, minimized) {
    state.minimized = minimized;
  }
}

export default {
  state,
  getters,
  mutations,
}