import {IncomingMessage} from "http"

import {Provider} from "react"

import responsiveFontSizes from "@material-ui/core/styles/responsiveFontSizes"
import createMuiTheme from "@material-ui/core/styles/createMuiTheme"

import {ThemeProvider, Theme} from "@material-ui/core"
import {Cookies, CookieConsent} from "./util/cookies"

import webStorage from "./util/web-storage"
import setCookie from "./util/cookies/set-cookie"

function isThemeType(
    supportedThemeTypes: Set<ThemeType>,
    themeType: string,
): themeType is ThemeType {
  return supportedThemeTypes.has(themeType as ThemeType)
}

async function getThemeTypeServerSide(
    supportedThemeTypes: Set<ThemeType>,
    cookies: Cookies,
    req: IncomingMessage,
): Promise<ThemeType> {
  console.log(
      "getThemeTypeServerSide: supported theme types:",
      supportedThemeTypes,
  )
  let cookie
  if ((cookie = cookies["theme-type"])) {
    console.log("getThemeTypeServerSide: found a theme type cookie:", {
      "theme-type": cookie,
    })
    if (isThemeType(supportedThemeTypes, cookie)) {
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
    supportedThemeTypes: Set<ThemeType>,
    serverSideThemeType: ThemeType,
): Promise<ThemeType> {
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
    supportedThemeTypes: Set<ThemeType>,
    cookieConsent: CookieConsent,
    themeType: ThemeType,
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
  // TODO: implement theme-sniffing function!
  return "light"
}

export type ThemeType = "auto" | "light" | "dark"

async function makeTheme(themeType: ThemeType): Promise<Theme> {
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

export default {
  key: "theme",
  defaultValue: "auto",
  defaultValues: new Set<ThemeType>(["auto", "light", "dark"]),
  initializeValue: {
    serverSide: getThemeTypeServerSide,
    clientSide: getThemeTypeClientSide,
  },
  setValue: setThemeTypeClientSide,
  controlContext: {
    transformValue: async (theme: ThemeType): Promise<Theme> =>
      makeTheme(theme),
    ContextProvider: (ThemeProvider as unknown) as Provider<Theme>,
  },
}
