import _app from "pages/_app"
import {DehydratedAppState, HydratedGlobalAppState} from "./index"

function makeGlobalAppState(
    dehydratedAppState: DehydratedAppState,
    App: _app,
): HydratedGlobalAppState {
  return {
    ...dehydratedAppState,
    languages: new Set(dehydratedGlobalAppState.languages),
    themes: new Set(dehydratedGlobalAppState.themes),
    setLang: App.setLang.bind(App),
    setTheme: App.setTheme.bind(App),
    setCookieConsent: App.setCookieConsent.bind(App),
  }
}

export default makeGlobalAppState