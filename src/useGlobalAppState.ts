import {useContext} from "react"

import {GlobalAppStateProxy} from "./appFactory/GlobalAppState"
import {GlobalAppStateContext} from "./appFactory/GlobalAppStateContext"

function useGlobalAppState(): GlobalAppStateProxy {
  return useContext(GlobalAppStateContext)
}

export default useGlobalAppState
