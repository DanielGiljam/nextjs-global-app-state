import {Provider} from "react"

import appFactory from "../appFactory"
import lang from "../lang"
import theme from "../theme"

import {
  Theme,
  createMuiTheme,
  responsiveFontSizes,
} from "@material-ui/core/styles"

import Wrapper from "../components/wrapper"
import ThemeProvider from "../components/theme-provider"

import fetch from "isomorphic-unfetch"

export default appFactory({
  Wrapper: Wrapper,
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
      ThemeProvider: ThemeProvider as Provider<Theme>,
    }),
  ],
})
