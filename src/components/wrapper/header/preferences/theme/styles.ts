import {Theme, createStyles, makeStyles} from "@material-ui/core/styles"

export default makeStyles((theme: Theme) =>
  createStyles({
    legend: {
      color: theme.palette.text.primary,
      gridArea: "legend",
      width: 200,
    },
    toggleButtonGroup: {
      marginTop: theme.spacing(1),
    },
  }),
)
