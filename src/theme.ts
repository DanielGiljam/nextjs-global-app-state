import {Provider} from "react"

import {Theme} from "@material-ui/core"
import {Cookies, CookieConsent} from "./util/cookies"
import {GlobalAppStatePropertyParameters} from "./appFactory/GlobalAppStateProperty"

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
    defaultThemeType: ThemeType,
    cookies: Cookies,
): Promise<ThemeType> {
  console.log(
      "getThemeTypeServerSide: supported theme types:",
      supportedThemeTypes,
  )
  let cookie
  if ((cookie = cookies.theme)) {
    console.log("getThemeTypeServerSide: found a theme type cookie:", {
      theme: cookie,
    })
    if (isThemeType(supportedThemeTypes, cookie)) {
      console.log(`getThemeTypeServerSide: returning "${cookie}"`)
      return cookie
    } else console.warn("getThemeTypeServerSide: the cookie was invalid.")
  } else console.log("getThemeTypeServerSide: found no theme type cookie.")
  console.log("getThemeTypeServerSide: falling back to:", {
    themeType: defaultThemeType,
  })
  return defaultThemeType
}

async function getThemeTypeClientSide(): Promise<ThemeType> {
  // (If environment isn't client's, throw an error)
  if (typeof window === "undefined") {
    throw new Error(
        "getThemeTypeClientSide() was called in an environment that isn't the client's.",
    )
  }
  // 1. Reading localStorage
  const local = window.localStorage.theme
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
  if (!cookieConsent) {
    throw new Error("Can't setThemeType() if cookieConsent isn't true!")
  }
  if (!supportedThemeTypes.has(themeType)) {
    throw new TypeError(
        "themeType parameter provided to setThemeType() must be a supported theme type!",
    )
  }
  console.log(`setThemeType: setting theme type to "${themeType}"...`)
  webStorage.set("theme", themeType)
  setCookie("theme", themeType)
  console.log(`setCookie: key "theme" was set to value "${themeType}".`)
}

function getThemeTypeAutoHelper1(): "light" | "dark" {
  const date = new Date()
  const hours = date.getHours()
  const themeType: "light" | "dark" = hours < 6 || hours > 18 ? "dark" : "light"
  console.log(
      `getThemeTypeAuto: setting theme to ${themeType} based on local time (${date.toLocaleTimeString()}).`,
  )
  return themeType
}

function getThemeTypeAutoHelper2(
    prefersColorScheme: "light" | "dark",
): boolean {
  if (
    window.matchMedia(`(prefers-color-scheme: ${prefersColorScheme})`).matches
  ) {
    console.log(
        `getThemeTypeAuto: client's browser prefers ${prefersColorScheme} theme.`,
    )
    console.log(
        `getThemeTypeAuto: setting theme to ${prefersColorScheme} based on client's browser's preference.`,
    )
    return true
  }
  return false
}

function getThemeTypeAuto(): "light" | "dark" {
  if (typeof window === "undefined") {
    console.log("getThemeTypeAuto: environment isn't the client's.")
    return "light"
  }
  let themeType: "light" | "dark"
  if (getThemeTypeAutoHelper2((themeType = "light"))) {
    return themeType
  }
  if (getThemeTypeAutoHelper2((themeType = "dark"))) {
    return themeType
  }
  if (window.matchMedia("(prefers-color-scheme: no-preference)").matches) {
    console.log(
        "getThemeTypeAuto: client's browser doesn't have a theme preference.",
    )
  } else {
    console.log(
        "getThemeTypeAuto: client's browser doesn't express any kind of theme preference.",
    )
  }
  themeType = getThemeTypeAutoHelper1()
  return themeType
}

type ThemeType = "auto" | "light" | "dark"

/**
 * An object literal. All fields are required.
 */
interface ThemeOptions {
  /**
   * A function that creates a theme. The function must be synchronous.
   * @param themeType Either `"light"` or `"dark"`
   * @returns A theme
   */
  createTheme(themeType: "light" | "dark"): Theme;
  /**
   * A `Context.Provider` for a `Context` that holds a theme. It doesn't
   * strictly have to be a `Context.Provider`. It just has to be
   * similar enough — more specifically, it has to be a
   * component that wraps its children and takes
   * a prop called `value`.
   */
  ThemeProvider: Provider<Theme>;
}

/**
 * A ready-made global app state property which auto-detects
 * system theme or persists explicit preference across sessions.
 * @param options A `ThemeOptions` object
 * @returns A `GlobalAppStatePropertyParameters` object
 */
function theme(
    options: ThemeOptions,
): GlobalAppStatePropertyParameters<ThemeType, Theme> {
  const {createTheme, ThemeProvider} = options
  return {
    key: "theme",
    defaultValue: "auto",
    defaultValues: ["auto", "light", "dark"],
    initializeValue: {
      serverSide: getThemeTypeServerSide,
      clientSide: getThemeTypeClientSide,
    },
    setValue: setThemeTypeClientSide,
    // For demo purposes — in this "strict edition" — `theme` counts as a sensitive global app state property
    isSensitiveInformation: true,
    controlContext: {
      transformValue: (themeType: ThemeType): Theme =>
        createTheme(
          themeType === "auto" ?
            getThemeTypeAuto() :
            (themeType as "light" | "dark"),
        ),
      ContextProvider: ThemeProvider,
    },
  }
}

export default theme
