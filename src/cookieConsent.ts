import {IncomingMessage} from "http"

import {Cookies, CookieConsent} from "./util/cookies"
import {GlobalAppStatePropertyParameters} from "./appFactory/GlobalAppStateProperty"

import webStorage from "./util/web-storage"

async function getCookieConsentServerSide(
    values: Set<CookieConsent>,
    cookies: Cookies,
    req: IncomingMessage,
): Promise<boolean> {
  return cookies["cookie-consent"] === "true"
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

async function getCookieConsentClientSide(
    values: Set<CookieConsent>,
    existingValue: CookieConsent,
): Promise<CookieConsent> {
  // (If environment isn't client's, throw an error)
  if (typeof window === "undefined") {
    throw new Error(
        "getCookieConsentClientSide() was called in an environment that isn't the client's.",
    )
  }
  // 1. Reading localStorage
  const local = parseCookieConsent(window.localStorage.cookieConsent)
  if (local != null) {
    console.log(
        `getCookieConsentClientSide: returning "${local}" based on item in localStorage.`,
    )
    return local
  }
  // 2. Returning that cookie consent is neither true or false
  return null
}

async function setCookieConsentClientSide(
    values: Set<CookieConsent>,
    cookieConsent: CookieConsent,
    value: CookieConsent,
): Promise<void> {
  console.log(
      `setCookieConsent: setting cookie consent to "${cookieConsent}"...`,
  )
  webStorage.set("cookieConsent", (cookieConsent as boolean).toString())
}

function cookieConsent(): GlobalAppStatePropertyParameters<CookieConsent> {
  return {
    key: "cookieConsent",
    defaultValue: false,
    defaultValues: new Set<CookieConsent>([true, false, null]),
    initializeValue: {
      serverSide: getCookieConsentServerSide,
      clientSide: getCookieConsentClientSide,
    },
    setValue: setCookieConsentClientSide,
  }
}

export default cookieConsent
