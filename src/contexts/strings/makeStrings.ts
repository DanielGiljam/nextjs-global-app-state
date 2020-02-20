import stringsFetcher from "../../util/strings/fetcher"
import mergeResources from "../../util/strings/merge-resources"

import {Strings} from "./index"

async function makeStrings(
    lang: string,
    stringResourcesPath: string,
): Promise<Strings> {
  console.log("makeStrings: fetching strings for \"en\"...")
  const en = await stringsFetcher("en", stringResourcesPath)
  if (lang === "en") return en
  console.log(`makeStrings: fetching strings for "${lang}"...`)
  const stringResources = await stringsFetcher(lang, stringResourcesPath)
  return mergeResources(en, stringResources, "stringResources")
}

export default makeStrings
