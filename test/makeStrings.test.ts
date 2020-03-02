import makeStrings from "../src/util/strings/makeStrings"
import {Strings} from "../src/util/strings"
import {promises} from "fs"
import {resolve} from "path"

async function stringsFetcher(lang: string): Promise<Strings> {
  return JSON.parse(
    (await promises.readFile(
        resolve(__dirname, `../public/string-resources/${lang}.json`),
        {encoding: "UTF-8"},
    )) as string,
  )
}

function makeStringsTest(): void {
  makeStrings("sv", "en", stringsFetcher).then((strings) =>
    console.log(strings),
  )
}

export default makeStringsTest
