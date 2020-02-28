import {useContext} from "react"

import {StringsContext, Strings} from "./util/strings"

export default function useStrings(): Strings {
  return useContext(StringsContext)
}
