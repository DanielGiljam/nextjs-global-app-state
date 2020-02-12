import {CookieConsent} from "./index"

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

export default parseCookieConsent
