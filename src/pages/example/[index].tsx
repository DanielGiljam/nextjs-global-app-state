import {useRouter} from "next/router"

import React from "react"

import Typography from "@material-ui/core/Typography"

import useStrings from "../../useStrings"

import format from "../../util/strings/format"

function Example(): JSX.Element {
  const strings = useStrings()
  const router = useRouter()
  const {index: example} = router.query
  console.log("example router:", router)
  return (
    <Typography variant={"body1"}>
      {example ?
        format(
            strings.general.templates.thisIsTheXExample,
            Array.isArray(example) ? example[0] : example,
        ) :
        strings.example.thisIsNullExample}
    </Typography>
  )
}

export default Example
