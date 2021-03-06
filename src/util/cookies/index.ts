import parseCookies from "./parse-cookies"
import purgeCookies from "./purge-cookies"
import setCookie from "./set-cookie"

export type CookieConsent = boolean | null

export interface Cookies {
  [key: string]: string;
}

export async function setCookies(cookies: Cookies): Promise<void> {
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
    // Deleting every key in existingCookies that is also in the cookies-object
    // that was passed as an argument to this function. This way existingCookies
    // is virtually "remainingCookies" by the end of this loop.
    if (!delete existingCookies[cookieKey]) {
      // If a key deletion is unsuccessful, a warning is logged about that.
      console.warn(
          `setCookies: failed operating on cookie "${cookieKey}"! As a result, it will be unset. Sorry!`,
      )
    }
  }
  // Purging all "cookies" that still remain in existingCookies
  purgeCookies(existingCookies)
  console.log("setCookies: resulting cookies:", {
    resultingCookies: document.cookie,
  })
}
