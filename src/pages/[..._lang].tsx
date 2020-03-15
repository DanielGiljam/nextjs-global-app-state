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
  const lang = Array.isArray(query._lang) ? query._lang[0] : query._lang
  const as = (asPath as string).replace(new RegExp(`/${lang}/?`), "/")
  const url = as.replace(
      /(?:\?[^/]*)?$/,
      (match) => `${match || "?"}&lang=${lang}`,
  )
  return {
    redirectUrl: url,
    redirectAs: as,
  }
}

export default Lang
