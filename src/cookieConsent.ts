import {
  Cookies,
  CookieConsent,
  setCookie,
  purgeCookiesButCheck,
} from "./util/cookies"

import webStorage from "./util/web-storage"

async function getCookieConsentServerSide(
    _values: Set<CookieConsent>,
    _defaultValue: CookieConsent,
    cookies: Cookies,
): Promise<boolean> {
  return cookies.cookieConsent === "true"
}

function parseCookieConsent(
    cookieConsentString?: "true" | "false",
): CookieConsent {
  switch (cookieConsentString) {
    case "true":
      return true
    case "false":
      return false
    default:
      return null
  }
}

async function getCookieConsentClientSide(): Promise<CookieConsent> {
  // (If environment isn't client's, throw an error)
  if (typeof window === "undefined") {
    throw new Error(
        "getCookieConsentClientSide() was called in an environment that isn't the client's.",
    )
  }
  // 1. Reading localStorage
  let cookieConsent
  if (
    (cookieConsent = parseCookieConsent(window.localStorage.cookieConsent)) !=
    null
  ) {
    console.log(
        `getCookieConsentClientSide: returning "${cookieConsent}" based on item in localStorage.`,
    )
  }
  // 2. Reading sessionStorage
  if (
    (cookieConsent = parseCookieConsent(window.sessionStorage.cookieConsent)) !=
    null
  ) {
    console.log(
        `getCookieConsentClientSide: returning "${cookieConsent}" based on item in sessionStorage.`,
    )
  }
  // 3. Returning that cookie consent is neither true or false
  return cookieConsent
}

async function setCookieConsentClientSide(
    _values: Set<CookieConsent>,
    _cookieConsent: CookieConsent,
    value: CookieConsent,
): Promise<void> {
  const valueAsString = typeof value === "boolean" ? value.toString() : "null"
  console.log(
      `setCookieConsent: setting cookie consent to "${valueAsString}"...`,
  )
  webStorage.set("cookieConsent", valueAsString, "session")
  if (value) {
    webStorage.set("cookieConsent", valueAsString, "local")
    setCookie("cookieConsent", valueAsString)
    console.log(`setCookie: key "theme" was set to value "${valueAsString}".`)
  } else {
    if (window.localStorage.cookieConsent) webStorage.remove("cookieConsent")
    purgeCookiesButCheck({
      cookieConsent: valueAsString,
    })
  }
}

export default {
  key: "cookieConsent",
  defaultValue: false,
  defaultValues: [true, false, null],
  initializeValue: {
    serverSide: getCookieConsentServerSide,
    clientSide: getCookieConsentClientSide,
  },
  setValue: setCookieConsentClientSide,
}
