import parseCookies from "./parse-cookies"
import purgeCookies from "./purge-cookies"
import setCookie from "./set-cookie"

export {parseCookies, purgeCookies, setCookie}

export type CookieConsent = boolean | null

export interface Cookies {
  [key: string]: string;
}

export function setCookies(cookies: Cookies): void {
  console.log("setCookies: cookies that will be set:", cookies)
  const existingCookies = parseCookies(document.cookie)
  console.log("setCookies: existing cookies:", {
    existingCookies: document.cookie,
  })
  let cookieValue
  let existingCookieValue
  for (const cookieKey of Object.keys(cookies)) {
    // If a key exists in both existingCookies and in the cookies-object
    // that was passed as an argument to this function, but the values don't match,
    // then the corresponding cookie is reset with the value in the cookies-object.
    // An appropriate message is logged about that.
    if (
      (cookieValue = cookies[cookieKey]) !==
      (existingCookieValue = existingCookies[cookieKey])
    ) {
      if (existingCookieValue) {
        console.log(
            `setCookies: key "${cookieKey}" will be set from value "${existingCookieValue}" to value "${cookieValue}".`,
        )
      } else {
        console.log(
            `setCookies: key "${cookieKey}" will be set to value "${cookieValue}".`,
        )
      }
      setCookie(cookieKey, cookieValue)
    }
  }
  console.log("setCookies: resulting cookies:", {
    resultingCookies: document.cookie,
  })
}

export function purgeCookiesButCheck(cookies: Cookies): void {
  const existingCookies = parseCookies(document.cookie)
  Object.keys(cookies).forEach((key) => {
    if (!existingCookies[key]) delete cookies[key]
  })
  purgeCookies(cookies)
}
