import {useContext} from "react"

import {StringsContext, Strings} from "./index"

export default function useStrings(): Strings {
  return useContext(StringsContext)
}
