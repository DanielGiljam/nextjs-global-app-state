import {useRouter} from "next/router"

import React, {ReactNode, useEffect} from "react"

import Header from "./header"
import CookieConsentSnackbar from "./cookie-consent-snackbar"

import useGlobalAppState from "../../useGlobalAppState"

function Wrapper({children}: {children: ReactNode}): JSX.Element {
  const {setLang} = useGlobalAppState()
  const router = useRouter()
  useEffect(() => {
    const jssStyles = document.querySelector("#jss-server-side")
    jssStyles?.parentElement?.removeChild(jssStyles)
  }, [])
  useEffect(() => {
    let lang
    if (
      (lang = Array.isArray(router.query._lang) ?
        router.query._lang[0] :
        router.query._lang)
    ) {
      router.query._lang = ""
      setLang(lang)
    }
  }, [router.query._lang])
  return (
    <>
      <Header />
      {children}
      <CookieConsentSnackbar />
    </>
  )
}

export default Wrapper
