import _app from "../../pages/_app"
import {DehydratedGlobalAppState, HydratedGlobalAppState} from "./index"

function makeGlobalAppState(
    dehydratedGlobalAppState: DehydratedGlobalAppState,
    App: _app,
): HydratedGlobalAppState {
  return {
    ...dehydratedGlobalAppState,
    languages: new Set(dehydratedGlobalAppState.languages),
    themes: new Set(dehydratedGlobalAppState.themes),
    setLang: App.setLang.bind(App),
    setTheme: App.setTheme.bind(App),
    setCookieConsent: App.setCookieConsent.bind(App),
  }
}

export default makeGlobalAppState
