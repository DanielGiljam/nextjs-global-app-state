import {useContext} from "react"

import {GlobalAppStateContext, GlobalAppState} from "./index"

export default function useGlobalAppState(): GlobalAppState {
  return useContext(GlobalAppStateContext)
}
