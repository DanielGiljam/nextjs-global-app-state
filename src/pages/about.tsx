import React from "react"

import Typography from "@material-ui/core/Typography"

import useStrings from "../useStrings"

import format from "../util/strings/format"
import ucFirst from "../util/strings/ucFirst"

function About(): JSX.Element {
  const strings = useStrings()
  return (
    <Typography variant={"body1"}>
      {format(
          strings.general.templates.thisIsTheXPage,
          ucFirst(strings.general.pageNames.about),
      )}
    </Typography>
  )
}

export default About
