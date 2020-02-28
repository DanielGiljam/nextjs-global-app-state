import Router from "next/router"

import {useEffect} from "react"

function Lang({redirectUrl, redirectAs}) {
  useEffect(() => {
    Router.replace(redirectUrl, redirectAs)
  }, [])
  return null
}

Lang.getInitialProps = async ({asPath, query}) => {
  const lang = query.lang[0]
  const as = asPath.replace(new RegExp(`/${lang}/?`), "/")
  const url = as.replace(
      /(?:\?[^/]*)?$/,
      (match) => `${match || "?"}&_lang=${lang}`,
  )
  return {
    redirectUrl: url,
    redirectAs: as,
  }
}

export default Lang
