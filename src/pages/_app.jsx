import Head from "next/head"

import appFactory from "../appFactory"
import lang from "lang"
import theme from "theme"

import extendStringClass from "util/strings/extendStringClass"

import responsiveFontSizes from "@material-ui/core/styles/responsiveFontSizes"
import createMuiTheme from "@material-ui/core/styles/createMuiTheme"
import ThemeProvider from "@material-ui/core/styles/ThemeProvider"

import Header from "components/header"
import CookieConsentBar from "components/misc/cookie-consent-snackbar"
import CssBaseline from "@material-ui/core/CssBaseline"

import fetch from "isomorphic-unfetch"

extendStringClass()

export default appFactory({
  Head: (
    <Head>
      <title>Test</title>
    </Head>
  ),
  // eslint-disable-next-line
  Wrapper: ({children}) => (
    <>
      <Header />
      {children}
      <CookieConsentBar />
    </>
  ),
  properties: [
    lang({
      defaultLang: "en",
      defaultSupportedLanguages: ["en", "sv", "fi"],
      getStrings: async (lang) =>
        await fetch(`${process.env.ASSET_PREFIX}/string-resources/${lang}.json`)
            .then((res) => res.json())
            .catch(() => {
              console.error(`Failed to fetch string resources for "${lang}".`)
              return {}
            }),
    }),
    theme({
      createTheme: (themeType) =>
        responsiveFontSizes(createMuiTheme({palette: {type: themeType}})),
      // eslint-disable-next-line
      ThemeProvider: ({value, children}) => (
        <ThemeProvider theme={value}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      ),
    }),
  ],
})
