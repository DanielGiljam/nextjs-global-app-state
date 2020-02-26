import React, {Context, ReactNode, createContext} from "react"

import {GlobalAppStateProxy} from "./GlobalAppState"

interface GlobalAppStateContextProviderProps {
  globalAppState: GlobalAppStateProxy;
  children: ReactNode;
}

export let GlobalAppStateContext: Context<GlobalAppStateProxy>

export function GlobalAppStateContextProvider({
  globalAppState,
  children,
}: GlobalAppStateContextProviderProps): JSX.Element {
  if (!GlobalAppStateContext) {
    GlobalAppStateContext = createContext(globalAppState)
  }
  return (
    <GlobalAppStateContext.Provider value={globalAppState}>
      {children}
    </GlobalAppStateContext.Provider>
  )
}
