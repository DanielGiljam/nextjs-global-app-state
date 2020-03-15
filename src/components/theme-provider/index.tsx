import React, {ReactNode} from "react"

import {
  ThemeProvider as MuiThemeProvider,
  Theme,
} from "@material-ui/core/styles"
import CssBaseline from "@material-ui/core/CssBaseline"

interface ThemeProviderProps {
  value: Theme;
  children: ReactNode;
}

function ThemeProvider({value, children}: ThemeProviderProps): JSX.Element {
  return (
    <MuiThemeProvider theme={value}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}

export default ThemeProvider
