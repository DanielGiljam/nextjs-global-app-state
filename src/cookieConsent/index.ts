import {
  getCookieConsentServerSide,
  getCookieConsentClientSide,
  setCookieConsentClientSide,
  CookieConsent,
} from "../util/cookies"

import {GlobalAppStatePropertyParameters} from "../GlobalAppStateProperty"

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
