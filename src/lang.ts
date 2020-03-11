import {IncomingMessage} from "http"

import makeStrings from "./util/strings/makeStrings"

import {StringsContext, Strings} from "./util/strings"
import {Cookies, CookieConsent} from "./util/cookies"
import {GlobalAppStatePropertyParameters} from "./appFactory/GlobalAppStateProperty"

import webStorage from "./util/web-storage"
import setCookie from "./util/cookies/set-cookie"

function parseAcceptLanguageHeader(
    acceptLanguageHeader: string,
): {lang: string; flavor?: string; q?: number}[] {
  const parsedAcceptLanguagesHeader = []
  const regExp = /([^-,;]+)(?:-([^-,;]+(?:-[^-,;]+)*))?(?:;q=(\d(?:\.\d+)?))?,?/g
  let array
  while ((array = regExp.exec(acceptLanguageHeader)) != null) {
    parsedAcceptLanguagesHeader.push({
      lang: array[1],
      flavor: array[2],
      q: array[3] ? parseInt(array[3]) : undefined,
    })
  }
  return parsedAcceptLanguagesHeader
}

async function getLangServerSide(
    supportedLanguages: Set<string>,
    defaultLang: string,
    cookies: Cookies,
    req: IncomingMessage,
): Promise<string> {
  const acceptLanguageHeader = req.headers["accept-language"]
  console.log("getLangServerSide: supported languages:", supportedLanguages)
  if (cookies.lang) {
    console.log("getLangServerSide: found a language cookie:", {
      lang: cookies.lang,
    })
    const lang = cookies.lang.slice(0, 2) // e.g. "en-US" --> "en"
    if (supportedLanguages.has(lang)) {
      console.log(`getLangServerSide: returning "${lang}"`)
      return lang
    } else console.warn("getLangServerSide: the cookie was invalid.")
  } else console.log("getLangServerSide: found no language cookie.")
  if (acceptLanguageHeader) {
    const acceptedLanguages = parseAcceptLanguageHeader(acceptLanguageHeader)
    console.log(
        "getLangServerSide: proceeding with parsing the \"Accept-Language\" header:",
        acceptLanguageHeader,
    )
    console.log("getLangServerSide: accepted languages:", acceptedLanguages)
    for (const {lang} of acceptedLanguages) {
      if (supportedLanguages.has(lang)) {
        console.log(`getLangServerSide: returning "${lang}"`)
        return lang
      }
    }
    console.log("getLangServerSide: no accepted language is supported.")
  } else console.log("getLangServerSide: found no \"Accept-Language\" header.")
  console.log("getLangServerSide: falling back to:", {lang: defaultLang})
  return defaultLang
}

async function getLangClientSide(
    supportedLanguages: Set<string>,
    serverSideLang: string,
): Promise<string> {
  // (If environment isn't client's, throw an error)
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    throw new Error(
        "getLangClientSide() was called in an environment that isn't the client's.",
    )
  }
  // 1. Reading localStorage
  const local = window.localStorage.lang
  if (local) {
    console.log(
        `getLangClientSide: returning "${local}" based on item in localStorage.`,
    )
    return local
  }
  // 2. Reading sessionStorage
  const session = window.sessionStorage.lang
  if (session) {
    console.log(
        `getLangClientSide: returning "${session}" based on item in sessionStorage.`,
    )
    return session
  }
  let lang = serverSideLang
  let browserPreference
  // 3. Reading browser's language preferences
  if (
    (browserPreference = navigator.languages.find(
        (lang) => supportedLanguages.has(lang.slice(0, 2)), // e.g. "en-US" --> "en"
    )) != null
  ) {
    lang = browserPreference.slice(0, 2) // e.g. "en-US" --> "en"
    console.log(
        `getLangClientSide: returning "${lang}" based on client's browser's language preference.`,
    )
  } else {
    console.log(`getLangClientSide: returning "${lang}" based on nothing.`)
  }
  // (Returning the result + populating sessionStorage.lang with the result)
  webStorage.set("lang", lang, "session")
  return lang
}

async function setLangClientSide(
    supportedLanguages: Set<string>,
    cookieConsent: CookieConsent,
    lang: string,
): Promise<void> {
  if (!supportedLanguages.has(lang)) {
    throw new TypeError(
        "\"lang\" parameter provided to setLang() must be a supported language!",
    )
  }
  console.log(`setLang: setting language to "${lang}"...`)
  webStorage.set("lang", lang)
  if (cookieConsent) {
    setCookie("lang", lang)
    console.log(`setCookie: key "lang" was set to value "${lang}".`)
  }
}

interface LangOptions {
  defaultLang: string;
  defaultSupportedLanguages: string[];
  getStrings(lang: string): Promise<Strings>;
  getSupportedLanguages?: {
    serverSide?(): Promise<Set<string>>;
    clientSide?(): Promise<Set<string>>;
  };
}

function lang({
  defaultLang,
  defaultSupportedLanguages,
  getStrings,
  getSupportedLanguages,
}: LangOptions): GlobalAppStatePropertyParameters<string, Strings> {
  return {
    key: "lang",
    keyPlural: "languages",
    defaultValue: defaultLang,
    defaultValues: new Set<string>(defaultSupportedLanguages),
    initializeValue: {
      serverSide: getLangServerSide,
      clientSide: getLangClientSide,
    },
    getValues: getSupportedLanguages,
    setValue: setLangClientSide,
    controlContext: {
      transformValue: async (lang: string): Promise<Strings> =>
        await makeStrings(lang, defaultLang, getStrings),
      isSerializable: true,
      context: StringsContext,
    },
  }
}

export default lang
