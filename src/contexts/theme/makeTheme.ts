import responsiveFontSizes from "@material-ui/core/styles/responsiveFontSizes"
import createMuiTheme, {Theme} from "@material-ui/core/styles/createMuiTheme"

import {getThemeTypeAuto} from "../../util/theme"

function makeTheme(themeType: string): Theme {
  return responsiveFontSizes(
      createMuiTheme({
        palette: {
          type:
          themeType === "auto" ?
            getThemeTypeAuto() :
            (themeType as "light" | "dark"),
        },
      }),
  )
}

export default makeTheme
