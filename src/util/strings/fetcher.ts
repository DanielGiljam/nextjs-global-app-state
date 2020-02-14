import fetch from "isomorphic-unfetch"

import {Strings} from "../../contexts/strings"

export default async function stringsFetcher(lang: string): Promise<Strings> {
  return await fetch(
      `${process.env.ASSET_PREFIX}/string-resources/${lang}.json`,
  )
      .then((res) => res.json())
      .catch(() => {
        console.error(`Failed to fetch string resources for "${lang}".`)
        return {}
      })
}
