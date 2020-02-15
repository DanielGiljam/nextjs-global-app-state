import React, {useEffect, useState} from "react"

import {AppInitialProps, AppContext, AppProps} from "next/app"
import Head from "next/head"

import {IncomingMessage} from "http"
import {ParsedUrlQuery} from "querystring"

import CssBaseline from "@material-ui/core/CssBaseline"
import {ThemeProvider, Theme} from "@material-ui/core/styles"
import {StringsProvider, Strings} from "../contexts/strings"
import {
  GlobalAppStateProvider,
  DehydratedGlobalAppState,
  GlobalAppState,
} from "../contexts/global-app-state"

import makeStrings from "../contexts/strings/makeStrings"
import makeTheme from "../contexts/theme/makeTheme"
import makeGlobalAppState from "../contexts/global-app-state/makeGlobalAppState"

import {
  getLangServerSide,
  getLangClientSide,
  setLangClientSide,
  extendStringClass,
} from "../util/strings"
import {
  getThemeTypeServerSide,
  getThemeTypeClientSide,
  setThemeTypeClientSide,
} from "../util/theme"
import {
  getCookieConsentServerSide,
  getCookieConsentClientSide,
  setCookieConsentClientSide,
  setCookies,
} from "../util/cookies"

import parseCookies from "../util/cookies/parse-cookies"

interface App {
  (props: AppInitialPropsExtended & AppProps): JSX.Element;
  getInitialProps({
    Component,
    ctx,
  }: AppContext): Promise<AppInitialPropsExtended>;
  getInitialPropsServerSide(
    req: IncomingMessage
  ): Promise<InitialPropsServerSide>;
  getURLParams(query: ParsedUrlQuery): Promise<URLParams>;
}

interface AppState {
  strings: Strings;
  theme: Theme;
  globalAppState: GlobalAppState;
}

interface InitialPropsServerSide {
  strings: Strings;
  themeType: string;
  dehydratedGlobalAppState: DehydratedGlobalAppState;
}

interface URLParams {
  lang?: string | null;
}

interface AppInitialPropsExtended extends AppInitialProps {
  appProps: InitialPropsServerSide | null;
  urlParams: URLParams;
}

function AppFactory(): App {
  const App = function App(
      props: AppInitialPropsExtended & AppProps,
  ): JSX.Element {
    const {Component, pageProps, appProps, urlParams} = props

    // @ts-ignore
    if (!String.format) extendStringClass()

    const [{strings, theme, globalAppState}, setState] = useState(
        (): AppState => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const {strings, themeType, dehydratedGlobalAppState} = appProps!
          return {
            strings,
            theme: makeTheme(themeType),
            globalAppState: makeGlobalAppState(dehydratedGlobalAppState),
          }
        },
    )

    function setLang(lang: string): void {
      const {languages: supportedLanguages, cookieConsent} = globalAppState
      setLangClientSide(supportedLanguages, cookieConsent, lang)
          .then(() => makeStrings(lang))
          .then((strings) =>
            setState((prevState) => ({
              ...prevState,
              strings,
              globalAppState: {...prevState.globalAppState, lang},
            })),
          )
    }

    function setTheme(themeType: string): void {
      const {themes: supportedThemeTypes, cookieConsent} = globalAppState
      setThemeTypeClientSide(
          supportedThemeTypes,
          cookieConsent,
          themeType,
      ).then(() =>
        setState((prevState) => ({
          ...prevState,
          theme: makeTheme(themeType),
          globalAppState: {...prevState.globalAppState, theme: themeType},
        })),
      )
    }

    function setCookieConsent(cookieConsent: boolean): void {
      setCookieConsentClientSide(cookieConsent)
          .then(() =>
            setState((prevState) => ({
              ...prevState,
              globalAppState: {...prevState.globalAppState, cookieConsent},
            })),
          )
          .then(() => {
            if (cookieConsent) {
              const {lang, theme} = globalAppState
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

    useEffect(() => {
      // 1. Remove the server-side injected CSS
      const jssStyles = document.querySelector("#jss-server-side")
      jssStyles?.parentElement?.removeChild(jssStyles)
      // 2. Set language client side
      const {
        languages: supportedLanguages,
        lang: serverSideLang,
        theme: serverSideThemeType,
      } = globalAppState
      getLangClientSide(supportedLanguages, serverSideLang)
          .then((lang) => {
            if (lang !== serverSideLang) {
              return makeStrings(lang).then((strings) =>
                setState((prevState) => ({
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
              return setState((prevState) => ({
                ...prevState,
                theme: makeTheme(themeType),
                globalAppState: {...prevState.globalAppState, theme: themeType},
              }))
            }
          })
          .catch((error) => console.error(error.stack))
      // 4. Check if client has allowed cookies
      if (!globalAppState.cookieConsent) {
        getCookieConsentClientSide()
            .then((cookieConsent) => {
              if (cookieConsent == null) {
                return setState((prevState) => ({
                  ...prevState,
                  globalAppState: {...prevState.globalAppState, cookieConsent},
                }))
              } else if (cookieConsent === true) {
                return setCookieConsent(cookieConsent)
              }
            })
            .catch((error) => console.error(error.stack))
      }
    }, [])

    useEffect(() => {
      let lang
      if ((lang = urlParams.lang)) {
        urlParams.lang = null
        setLang(lang)
      }
    }, [urlParams.lang])

    return (
      <>
        <Head>
          <title>{strings.general.siteName}</title>
        </Head>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <StringsProvider strings={strings}>
            <GlobalAppStateProvider
              globalAppState={{
                ...globalAppState,
                setLang,
                setTheme,
                setCookieConsent,
              }}
            >
              <Component {...pageProps} />
            </GlobalAppStateProvider>
          </StringsProvider>
        </ThemeProvider>
      </>
    )
  }

  App.getInitialProps = async ({
    Component,
    ctx,
  }: AppContext): Promise<AppInitialPropsExtended> => {
    const appProps = ctx.req ?
      await App.getInitialPropsServerSide(ctx.req) :
      null
    let pageProps = {}
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }
    const urlParams = await App.getURLParams(ctx.query)
    return {pageProps, appProps, urlParams}
  }

  App.getInitialPropsServerSide = async (
    req: IncomingMessage,
  ): Promise<InitialPropsServerSide> => {
    // TODO: implement how the default values/dehydrated app state gets here!
    const dehydratedGlobalAppState: DehydratedGlobalAppState = {
      lang: "en",
      languages: ["en", "sv", "fi"],
      theme: "auto",
      themes: ["auto", "light", "dark"],
      cookieConsent: false,
    }
    const cookies = parseCookies(req.headers["cookie"])
    const lang = (dehydratedGlobalAppState.lang = await getLangServerSide(
        dehydratedGlobalAppState.languages,
        cookies,
        req.headers["accept-language"],
    ))
    const themeType = (dehydratedGlobalAppState.theme = await getThemeTypeServerSide(
        dehydratedGlobalAppState.themes,
        cookies,
    ))
    dehydratedGlobalAppState.cookieConsent = await getCookieConsentServerSide(
        cookies,
    )
    return {
      strings: await makeStrings(lang),
      themeType,
      dehydratedGlobalAppState,
    }
  }

  App.getURLParams = async (query: ParsedUrlQuery): Promise<URLParams> => {
    return {
      lang: Array.isArray(query._lang) ? query._lang[0] : query._lang,
    }
  }

  return App
}

export default AppFactory
