import React, {ReactNode, useEffect} from "react"

import Header from "./header"
import CookieConsentSnackbar from "./cookie-consent-snackbar"

function Wrapper({children}: {children: ReactNode}): JSX.Element {
  useEffect(() => {
    const jssStyles = document.querySelector("#jss-server-side")
    jssStyles?.parentElement?.removeChild(jssStyles)
  }, [])
  return (
    <>
      <Header />
      {children}
      <CookieConsentSnackbar />
    </>
  )
}

export default Wrapper
