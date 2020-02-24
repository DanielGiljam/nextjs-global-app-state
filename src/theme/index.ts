import {Provider} from "react"

import {ThemeProvider, Theme} from "@material-ui/core"

import makeTheme from "../contexts/theme/makeTheme"

import {
  getThemeTypeServerSide,
  getThemeTypeClientSide,
  setThemeTypeClientSide,
} from "../util/theme"

import {GlobalAppStatePropertyParameters} from "../GlobalAppStateProperty"

function theme(): GlobalAppStatePropertyParameters<string, Theme> {
  return {
    key: "theme",
    defaultValue: "auto",
    defaultValues: new Set<string>(["auto", "light", "dark"]),
    initializeValue: {
      serverSide: getThemeTypeServerSide,
      clientSide: getThemeTypeClientSide,
    },
    setValue: setThemeTypeClientSide,
    controlContext: {
      transformValue: async (theme: string): Promise<Theme> => makeTheme(theme),
      ContextProvider: (ThemeProvider as unknown) as Provider<Theme>,
    },
  }
}

export default theme
