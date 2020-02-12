import __app, {AppInitialProps, AppContext, AppProps} from "next/app"
import Head from "next/head"

import {IncomingMessage} from "http"

import CssBaseline from "@material-ui/core/CssBaseline"
import {ThemeProvider, Theme} from "@material-ui/core/styles"
import {StringsProvider, Strings} from "contexts/strings"
import {
  GlobalAppStateProvider,
  DehydratedGlobalAppState,
  GlobalAppState,
} from "contexts/global-app-state"

import makeStrings from "contexts/strings/makeStrings"
import makeTheme from "contexts/theme/makeTheme"
import makeGlobalAppState from "contexts/global-app-state/makeGlobalAppState"

import {
  getLangServerSide,
  getLangClientSide,
  setLang,
  extendStringClass,
} from "util/strings"
import {
  getThemeTypeServerSide,
  getThemeTypeClientSide,
  setThemeType,
} from "util/theme"
import {
  getCookieConsentServerSide,
  getCookieConsentClientSide,
  setCookieConsent,
  setCookies,
} from "util/cookies"

import parseCookies from "util/cookies/parse-cookies"

interface AppState {
  strings: Strings;
  theme: Theme;
  globalAppState: GlobalAppState;
}

interface InitialPropsServerSide {
  strings: Strings;
  themeType: string;
  dehydratedAppState: DehydratedGlobalAppState;
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _app extends __app<{}, {}, AppState> {
  constructor(props: AppInitialProps & AppProps) {
    super(props)
    extendStringClass()
    const {strings, themeType, dehydratedAppState} = props.pageProps.appProps
    /* NOTE: makeStrings() vs makeTheme() vs makeGlobalAppState():
     * - makeStrings() provides a performance boost from a UX point of view if it runs server-side.
     * - makeTheme() cannot be run server-side due to it's return value not being serializable. (The return value from
     *   getInitialProps is always serialized. See https://nextjs.org/docs/api-reference/data-fetching/getInitialProps.)
     * - makeGlobalAppState() makes and returns an object that is heavily tied to the instantiated _app -component's
     *   state on the client-side, so as an obvious consequence it cannot be serialized and the function can't run
     *   server-side.
     */
    this.state = {
      strings,
      theme: makeTheme(themeType),
      globalAppState: makeGlobalAppState(dehydratedAppState, this),
    }
  }

  static async getInitialProps({
    Component,
    ctx,
  }: AppContext): Promise<AppInitialProps> {
    const appProps = ctx.req ?
      await this.getInitialPropsServerSide(ctx.req) :
      null
    let pageProps = {}
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }
    const urlParams = {lang: ctx.query._lang}
    /* NOTE: The practice of returning everything inside the "pageProps" property of an object
     * is because Next.js expects the return value to look like that (the code would break otherwise).
     */
    return {pageProps: {pageProps, appProps, urlParams}}
  }

  static async getInitialPropsServerSide(
      req: IncomingMessage,
  ): Promise<InitialPropsServerSide> {
    // TODO: implement how the default values/dehydrated app state gets here!
    const dehydratedAppState: DehydratedGlobalAppState = {
      lang: "en",
      languages: ["en", "sv", "fi"],
      theme: "auto",
      themes: ["auto", "light", "dark"],
      cookieConsent: false,
    }
    const cookies = parseCookies(req.headers["cookie"])
    const lang = (dehydratedAppState.lang = await getLangServerSide(
        dehydratedAppState.languages,
        cookies,
        req.headers["accept-language"],
    ))
    const themeType = (dehydratedAppState.theme = await getThemeTypeServerSide(
        dehydratedAppState.themes,
        cookies,
    ))
    dehydratedAppState.cookieConsent = await getCookieConsentServerSide(cookies)
    /* NOTE: makeStrings() vs makeTheme() vs makeGlobalAppState():
     * - makeStrings() provides a performance boost from a UX point of view if it runs server-side.
     * - makeTheme() cannot be run server-side due to it's return value not being serializable. (The return value from
     *   getInitialProps is always serialized. See https://nextjs.org/docs/api-reference/data-fetching/getInitialProps.)
     * - makeGlobalAppState() makes and returns an object that is heavily tied to the instantiated _app -component's
     *   state on the client-side, so as an obvious consequence it cannot be serialized and the function can't run
     *   server-side.
     */
    return {strings: await makeStrings(lang), themeType, dehydratedAppState}
  }

  componentDidMount(): void {
    // 1. Remove the server-side injected CSS
    const jssStyles = document.querySelector("#jss-server-side")
    jssStyles?.parentElement?.removeChild(jssStyles)
    // 2. Set language client side
    const {
      languages: supportedLanguages,
      lang: serverSideLang,
      theme: serverSideThemeType,
    } = this.state.globalAppState
    getLangClientSide(supportedLanguages, serverSideLang)
        .then((lang) => {
          if (lang !== serverSideLang) {
            return makeStrings(lang).then((strings) =>
              this.setState((prevState) => ({
                ...prevState,
                strings,
                globalAppState: {...prevState.globalAppState, lang},
              })),
            )
          }
        })
        .catch((error) => console.error(error.stack))
    // 3. Check theme client side
    getThemeTypeClientSide()
        .then((themeType) => {
          if (themeType !== serverSideThemeType) {
            return this.setState((prevState) => ({
              ...prevState,
              theme: makeTheme(themeType),
              globalAppState: {...prevState.globalAppState, theme: themeType},
            }))
          }
        })
        .catch((error) => console.error(error.stack))
    // 4. Check if client has allowed cookies
    if (!this.state.globalAppState.cookieConsent) {
      getCookieConsentClientSide()
          .then((cookieConsent) => {
            if (cookieConsent == null) {
              return this.setState((prevState) => ({
                ...prevState,
                globalAppState: {...prevState.globalAppState, cookieConsent},
              }))
            } else if (cookieConsent === true) {
              return this.setCookieConsent(cookieConsent)
            }
          })
          .catch((error) => console.error(error.stack))
    }
  }

  componentDidUpdate(): void {
    const urlParams = this.props.pageProps.urlParams
    let lang
    if ((lang = urlParams.lang)) {
      urlParams.lang = null
      this.setLang(lang)
    }
  }

  setLang(lang: string): void {
    const {
      languages: supportedLanguages,
      cookieConsent,
    } = this.state.globalAppState
    setLang(supportedLanguages, cookieConsent, lang)
        .then(() => makeStrings(lang))
        .then((strings) =>
          this.setState((prevState) => ({
            ...prevState,
            strings,
            globalAppState: {...prevState.globalAppState, lang},
          })),
        )
  }

  setTheme(themeType: string): void {
    const {
      themes: supportedThemeTypes,
      cookieConsent,
    } = this.state.globalAppState
    setThemeType(supportedThemeTypes, cookieConsent, themeType).then(() =>
      this.setState((prevState) => ({
        ...prevState,
        theme: makeTheme(themeType),
        globalAppState: {...prevState.globalAppState, theme: themeType},
      })),
    )
  }

  setCookieConsent(cookieConsent: boolean): void {
    setCookieConsent(cookieConsent)
        .then(() =>
          this.setState((prevState) => ({
            ...prevState,
            globalAppState: {...prevState.globalAppState, cookieConsent},
          })),
        )
        .then(() => {
          if (cookieConsent) {
            const {lang, theme} = this.state.globalAppState
            return setCookies({
              "lang": lang,
              "theme-type": theme,
              "cookie-consent": cookieConsent.toString(),
            })
          } else {
            return setCookies({})
          }
        })
        .catch((error) => console.error(error.stack))
  }

  render(): JSX.Element {
    const {
      Component,
      pageProps: {pageProps},
    } = this.props
    const {strings, theme, globalAppState} = this.state
    return (
      <>
        <Head>
          <title>{strings.general.siteName}</title>
        </Head>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <StringsProvider strings={strings}>
            <GlobalAppStateProvider globalAppState={globalAppState}>
              <Component {...pageProps} />
            </GlobalAppStateProvider>
          </StringsProvider>
        </ThemeProvider>
      </>
    )
  }
}

export default _app
