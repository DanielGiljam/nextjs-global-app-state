import {CookieConsent, CookieConsentString} from "./index"

function parseCookieConsent(
    cookieConsentString: CookieConsentString,
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
