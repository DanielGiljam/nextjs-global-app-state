import PropTypes from "prop-types"

import React, {createContext, Context} from "react"

import {CookieConsent} from "../../util/cookies"

export interface PrecursorGlobalAppState {
  lang: string;
  theme: string;
  cookieConsent: CookieConsent;
}

export interface DehydratedGlobalAppState extends PrecursorGlobalAppState {
  languages: string[];
  themes: string[];
}

export interface GlobalAppState extends PrecursorGlobalAppState {
  languages: Set<string>;
  themes: Set<string>;
  setLang(lang: string): void;
  setTheme(themeType: string): void;
  setCookieConsent(cookieConsent: CookieConsent): void;
}

export type HydratedGlobalAppState = GlobalAppState

export let GlobalAppStateContext: Context<GlobalAppState>

interface GlobalAppStateProviderProps {
  globalAppState: GlobalAppState;
  children: React.ReactNode;
}

export function GlobalAppStateProvider({
  globalAppState,
  children,
}: GlobalAppStateProviderProps): JSX.Element {
  if (!GlobalAppStateContext) {
    GlobalAppStateContext = createContext(globalAppState)
  }
  return (
    <GlobalAppStateContext.Provider value={globalAppState}>
      {children}
    </GlobalAppStateContext.Provider>
  )
}

GlobalAppStateProvider.propTypes = {
  globalAppState: PropTypes.any.isRequired,
  children: PropTypes.node.isRequired,
}
