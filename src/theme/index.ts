import {Provider} from "react"

import {IncomingMessage} from "http"

import responsiveFontSizes from "@material-ui/core/styles/responsiveFontSizes"
import createMuiTheme from "@material-ui/core/styles/createMuiTheme"

import {ThemeProvider, Theme} from "@material-ui/core"
import {Cookies, CookieConsent} from "util/cookies"
import {GlobalAppStatePropertyParameters} from "../GlobalAppStateProperty"

import webStorage from "util/web-storage"
import setCookie from "util/cookies/set-cookie"

async function getThemeTypeServerSide(
    supportedThemeTypes: Set<string>,
    cookies: Cookies,
    req: IncomingMessage,
): Promise<string> {
  console.log(
      "getThemeTypeServerSide: supported theme types:",
      supportedThemeTypes,
  )
  let cookie
  if ((cookie = cookies["theme-type"])) {
    console.log("getThemeTypeServerSide: found a theme type cookie:", {
      "theme-type": cookie,
    })
    if (supportedThemeTypes.has(cookie)) {
      console.log(`getThemeTypeServerSide: returning "${cookie}"`)
      return cookie
    } else console.warn("getThemeTypeServerSide: the cookie was invalid.")
  } else console.log("getThemeTypeServerSide: found no theme type cookie.")
  console.log("getThemeTypeServerSide: falling back to:", {
    themeType: "light",
  })
  return "light"
}

async function getThemeTypeClientSide(
    supportedThemeTypes: Set<string>,
    serverSideThemeType: string,
): Promise<"auto" | "light" | "dark"> {
  // (If environment isn't client's, throw an error)
  if (typeof window === "undefined") {
    throw new Error(
        "getThemeTypeClientSide() was called in an environment that isn't the client's.",
    )
  }
  // 1. Reading localStorage
  const local = window.localStorage.themeType
  if (local) {
    console.log(
        `getThemeTypeClientSide: returning "${local}" based on item in localStorage.`,
    )
    return local
  }
  // 2. Returning theme type "auto" if no theme type was explicitly specified in localStorage
  console.log("getThemeTypeClientSide: returning \"auto\" based on nothing.")
  return "auto"
}

async function setThemeTypeClientSide(
    supportedThemeTypes: Set<string>,
    cookieConsent: CookieConsent,
    themeType: string,
): Promise<void> {
  if (!supportedThemeTypes.has(themeType)) {
    throw new TypeError(
        "themeType parameter provided to setThemeType() must be a supported theme type!",
    )
  }
  console.log(`setThemeType: setting theme type to "${themeType}"...`)
  webStorage.set("themeType", themeType)
  if (cookieConsent) {
    setCookie("theme-type", themeType)
    console.log(`setCookie: key "theme-type" was set to value "${themeType}".`)
  }
}

function getThemeTypeAuto(): "light" | "dark" {
  return "light"
}

async function makeTheme(themeType: string): Promise<Theme> {
  return responsiveFontSizes(
      createMuiTheme({
        palette: {
          type:
          themeType === "auto" ?
            getThemeTypeAuto() :
            (themeType as "light" | "dark"),
        },
      }),
  )
}

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
