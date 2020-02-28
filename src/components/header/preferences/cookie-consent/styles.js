import makeStyles from "@material-ui/core/styles/makeStyles"

import green from "@material-ui/core/colors/green"
import red from "@material-ui/core/colors/red"

import color from "color"

function styles(theme) {
  return {
    legend: {
      color: theme.palette.text.primary,
      gridArea: "legend",
      width: 200,
    },
    button: {
      marginTop: theme.spacing(1),
    },
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
  }
}

export default makeStyles(styles)
