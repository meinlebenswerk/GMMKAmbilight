const state = {
  selectedKeyboard: null,
  keyboardInitialized: false,
};

const getters = {
  selectedKeyboard: state => state.selectedKeyboard,
  keyboardInitialized: state => state.keyboardInitialized,
}

const mutations = {
  changeKeyboard(state, payload) {
    const { device } = payload;
    state.selectedKeyboard = device;
  },
  setKeyboardInitState(state, payload) {
    state.keyboardInitialized = payload;
  }
};

const actions = {
  resetKeyboard(context) {
    context.commit('changeKeyboard', { device: null });
    context.commit('setKeyboardInitState', false);
  },

  selectKeyboard(context, device) {
    this._vm.$gmmkInterface.selectDevice(device)
      .then(({ device }) => context.commit('changeKeyboard', device)); 
  },

  intializeKeyboard(context) {
    this._vm.$gmmkInterface.initializeKeyboard()
      .then((result) => context.commit('setKeyboardInitState', result));
  }

}

export default {
  state,
  getters,
  mutations,
  actions
}