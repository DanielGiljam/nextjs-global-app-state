import fetch from "isomorphic-unfetch"

import {Strings} from "../../contexts/strings"

export default async function stringsFetcher(
    lang: string,
    stringResourcesPath: string,
): Promise<Strings> {
  return await fetch(`${stringResourcesPath}${lang}.json`)
      .then((res) => res.json())
      .catch(() => {
        console.error(`Failed to fetch string resources for "${lang}".`)
        return {}
      })
}
