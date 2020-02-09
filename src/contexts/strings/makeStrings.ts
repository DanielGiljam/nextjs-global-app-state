import stringsFetcher from "util/strings/fetcher"
import mergeResources from "util/strings/merge-resources"

import {Strings} from "./index"

async function makeStrings(lang: string): Promise<Strings> {
  console.log("makeStrings: fetching strings for \"en\"...")
  const en = await stringsFetcher("en")
  if (lang === "en") return en
  console.log(`makeStrings: fetching strings for "${lang}"...`)
  const stringResources = await stringsFetcher(lang)
  return mergeResources(en, stringResources, "stringResources")
}

export default makeStrings
