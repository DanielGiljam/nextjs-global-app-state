import {DehydratedGlobalAppState, GlobalAppState} from "./index"

function makeGlobalAppState(
    dehydratedGlobalAppState: DehydratedGlobalAppState,
): GlobalAppState {
  return {
    ...dehydratedGlobalAppState,
    languages: new Set<string>(dehydratedGlobalAppState.languages),
    themes: new Set<string>(dehydratedGlobalAppState.themes),
  }
}

export default makeGlobalAppState
