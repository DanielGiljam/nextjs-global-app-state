import makeStyles from "@material-ui/core/styles/makeStyles"

function styles(theme) {
  return {
    legend: {
      color: theme.palette.text.primary,
      gridArea: "legend",
      width: 200,
    },
    toggleButtonGroup: {
      marginTop: theme.spacing(1),
    },
  }
}

export default makeStyles(styles)
