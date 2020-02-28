import Typography from "@material-ui/core/Typography"

import useStrings from "useStrings"
import {useRouter} from "next/router"

function Example() {
  const strings = useStrings()
  const router = useRouter()
  const {index: example} = router.query
  console.log("example router:", router)
  return (
    <Typography variant={"body1"}>
      {example ?
        String.format(strings.general.templates.thisIsTheXExample, example) :
        strings.example.thisIsNullExample}
    </Typography>
  )
}

export default Example
