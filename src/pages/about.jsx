import Typography from "@material-ui/core/Typography"

import useStrings from "useStrings"

function About() {
  const strings = useStrings()
  return (
    <Typography variant={"body1"}>
      {String.format(
          strings.general.templates.thisIsTheXPage,
          strings.general.pageNames.about.ucFirst(),
      )}
    </Typography>
  )
}

export default About
