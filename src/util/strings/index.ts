import {Cookies, CookieConsent} from "util/cookies"
import setCookie from "util/cookies/set-cookie"
import webStorage from "util/local-storage"

function lcFirst(this: string): string {
  // eslint-disable-next-line no-invalid-this
  return this.replace(/^./, (match) => match.toLowerCase())
}

function ucFirst(this: string): string {
  // eslint-disable-next-line no-invalid-this
  return this.replace(/^./, (match) => match.toUpperCase())
}

function format(template: string, ...substitutions: string[]): string {
  const regExp = /([^\\])%s/
  let formattedString = template
  for (const substitution of substitutions) {
    const newFormattedString = formattedString.replace(
        regExp,
        `$1${substitution}`,
    )
    if (formattedString === newFormattedString) {
      console.error(
          "String.format() was called with too many arguments. " +
          `Template: "${template}". substitutions: ${substitutions.join(", ")}.`,
      )
    }
    formattedString = newFormattedString
  }
  if (regExp.test(formattedString)) {
    throw new Error(
        "String.format() was called with too few arguments. " +
        `Template: "${template}". substitutions: ${substitutions.join(", ")}.`,
    )
  }
  return formattedString
}

// TODO: see if "q" can be parsed further in parseAcceptLanguageHeader()!
function parseAcceptLanguageHeader(
    acceptLanguageHeader: string,
): {lang: string; flavor: string; q: string}[] {
  const parsedAcceptLanguagesHeader = []
  const regExp = /([^-,;]+)(?:-([^-,;]+(?:-[^-,;]+)*))?(?:;q=(\d(?:\.\d+)?))?,?/g
  let array
  while ((array = regExp.exec(acceptLanguageHeader)) != null) {
    parsedAcceptLanguagesHeader.push({
      lang: array[1],
      flavor: array[2],
      q: array[3],
    })
  }
  return parsedAcceptLanguagesHeader
}

// TODO: decide whether extendStringClass() is actually a good idea!
export function extendStringClass(): void {
  Object.defineProperties(String, {
    format: {configurable: true, value: format, writable: true},
  })
  // eslint-disable-next-line no-extend-native
  Object.defineProperties(String.prototype, {
    ucFirst: {configurable: true, value: ucFirst, writable: true},
    lcFirst: {configurable: true, value: lcFirst, writable: true},
  })
}

export async function getLangServerSide(
    supportedLanguages: string[],
    cookies: Cookies,
    acceptLanguageHeader?: string,
): Promise<string> {
  console.log("getLangServerSide: supported languages:", supportedLanguages)
  if (cookies.lang) {
    console.log("getLangServerSide: found a language cookie:", {
      lang: cookies.lang,
    })
    const lang = cookies.lang.slice(0, 2) // e.g. "en-US" --> "en"
    if (supportedLanguages.includes(lang)) {
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
      if (supportedLanguages.includes(lang)) {
        console.log(`getLangServerSide: returning "${lang}"`)
        return lang
      }
    }
    console.log("getLangServerSide: no accepted language is supported.")
  } else console.log("getLangServerSide: found no \"Accept-Language\" header.")
  console.log("getLangServerSide: falling back to:", {lang: "en"})
  return "en"
}

export async function getLangClientSide(
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

export async function setLang(
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
