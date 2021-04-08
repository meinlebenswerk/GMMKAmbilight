import { gcd } from '@/lib/utils'

const state = {
  screenResolution: null,
  screenResolutionDivider: 1,
  selectedSourceId: -1,
}

const getters = {
  screenResolution: state => state.screenResolution,
  screenResolutionDivider: state => state.screenResolutionDivider,
  selectedSourceId: state => state.selectedSourceId,
}

const mutations = {
  updateScreenResoltion(state, payload) {
    state.screenResolution = payload;
    state.screenResolutionDivider = gcd(payload.width, payload.height);
  },
  
  setSelectedSource(state, id) {
    state.selectedSourceId = id;
  }
}

const actions = {

}


export default {
  state,
  getters,
  mutations,
  actions
}