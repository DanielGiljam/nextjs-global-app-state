import {Theme, createStyles, makeStyles} from "@material-ui/core/styles"

import green from "@material-ui/core/colors/green"
import red from "@material-ui/core/colors/red"

import color from "color"

export default makeStyles((theme: Theme) =>
  createStyles({
    buttonPositive: {
      "color": green[500],
      "&:hover": {
        backgroundColor: color(green[500])
            .alpha(theme.palette.action.hoverOpacity)
            .rgb()
            .string(),
      },
    },
    buttonNegative: {
      "color": red[500],
      "&:hover": {
        backgroundColor: color(red[500])
            .alpha(theme.palette.action.hoverOpacity)
            .rgb()
            .string(),
      },
    },
  }),
)
