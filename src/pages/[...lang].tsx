import {NextPageContext} from "next"
import Router from "next/router"

import {useEffect} from "react"

interface LangProps {
  redirectUrl: string;
  redirectAs: string;
}

function Lang({redirectUrl, redirectAs}: LangProps): null {
  useEffect(() => {
    Router.replace(redirectUrl, redirectAs)
  }, [])
  return null
}

Lang.getInitialProps = async ({
  asPath,
  query,
}: NextPageContext): Promise<LangProps> => {
  const lang = Array.isArray(query.lang) ? query.lang[0] : query.lang
  const as = (asPath as string).replace(new RegExp(`/${lang}/?`), "/")
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
