import Typography from "@material-ui/core/Typography"

import useGlobalAppState from "useGlobalAppState"
import useStrings from "useStrings"
import useTheme from "@material-ui/core/styles/useTheme"

function Index() {
  const globalAppState = useGlobalAppState()
  const strings = useStrings()
  const theme = useTheme()
  console.group()
  console.log("GlobalAppStateProxy in child of App:", globalAppState)
  console.log("Strings in child of App:", strings)
  console.log("Theme in child of App:", theme)
  console.groupEnd()
  return (
    <Typography variant={"body1"}>
      {String.format(
          strings.general.templates.thisIsTheXPage,
          strings.general.pageNames.home.ucFirst(),
      )}
    </Typography>
  )
}

export default Index
