import {useEffect} from "react"

import appFactory from "appFactory"
import lang from "lang"
import theme from "theme"

import extendStringClass from "util/strings/extendStringClass"

import responsiveFontSizes from "@material-ui/core/styles/responsiveFontSizes"
import createMuiTheme from "@material-ui/core/styles/createMuiTheme"
import {ThemeProvider} from "@material-ui/core/styles"

import Header from "components/header"
import CookieConsentBar from "components/misc/cookie-consent-snackbar"
import CssBaseline from "@material-ui/core/CssBaseline"

import fetch from "isomorphic-unfetch"

extendStringClass()

export default appFactory({
  Wrapper: ({children}) => {
    useEffect(() => {
      const jssStyles = document.querySelector("#jss-server-side")
      if (jssStyles) {
        jssStyles.parentElement.removeChild(jssStyles)
      }
    }, [])
    return (
      <>
        <Header />
        {children}
        <CookieConsentBar />
      </>
    )
  },
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
      ThemeProvider: ({value, children}) => (
        <ThemeProvider theme={value}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      ),
    }),
  ],
})
