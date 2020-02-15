import {DehydratedGlobalAppState, IntermediateGlobalAppState} from "./index"

function makeGlobalAppState(
    dehydratedGlobalAppState: DehydratedGlobalAppState,
): IntermediateGlobalAppState {
  return {
    ...dehydratedGlobalAppState,
    languages: new Set<string>(dehydratedGlobalAppState.languages),
    themes: new Set<string>(dehydratedGlobalAppState.themes),
  }
}

export default makeGlobalAppState
