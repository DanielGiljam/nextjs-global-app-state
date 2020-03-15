import React from "react"

import FormControl from "@material-ui/core/FormControl"
import FormLabel from "@material-ui/core/FormLabel"
import FormHelperText from "@material-ui/core/FormHelperText"
import Button from "@material-ui/core/Button"

import useStyles from "./styles"
import useStrings from "../../../../../useStrings"
import useGlobalAppState from "../../../../../useGlobalAppState"

function CookieConsent(): JSX.Element {
  const styles = useStyles()
  const strings = useStrings().header.preferences.cookieConsent
  const {cookieConsent, setCookieConsent} = useGlobalAppState()
  return (
    <FormControl component={"fieldset"}>
      <FormLabel className={styles.legend} component={"legend"}>
        {strings.label}
      </FormLabel>
      <FormHelperText>
        {strings.state[cookieConsent ? "positive" : "negative"]}
      </FormHelperText>
      <Button
        className={`${styles.button} ${
          styles[cookieConsent ? "buttonNegative" : "buttonPositive"]
        }`}
        onClick={(): void => setCookieConsent(!cookieConsent)}
      >
        {strings.action[cookieConsent ? "negative" : "positive"]}
      </Button>
    </FormControl>
  )
}

export default CookieConsent
