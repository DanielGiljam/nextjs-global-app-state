import React, {Context, createContext} from "react"

import {HydratedState} from "./GlobalAppState"

interface GlobalAppStateContextProviderProps {
  globalAppState: HydratedState;
  children: React.ReactNode;
}

export let GlobalAppStateContext: Context<HydratedState>

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
