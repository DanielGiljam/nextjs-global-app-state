import PropTypes from "prop-types"

import React, {createContext} from "react"

export const StringsContext = createContext<Strings>({})

export interface Strings {
  [key: string]: string & Strings & Strings[];
}

interface StringsProviderProps {
  strings: Strings;
  children: React.ReactNode;
}

export function StringsProvider({
  strings,
  children,
}: StringsProviderProps): JSX.Element {
  return (
    <StringsContext.Provider value={strings}>
      {children}
    </StringsContext.Provider>
  )
}

StringsProvider.propTypes = {
  strings: PropTypes.any.isRequired,
  children: PropTypes.node.isRequired,
}
