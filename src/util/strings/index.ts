import {createContext} from "react"

export const StringsContext = createContext<Strings>({})

export interface Strings {
  [key: string]: string & Strings & Strings[];
}
