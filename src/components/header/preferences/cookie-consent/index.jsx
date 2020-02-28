import PropTypes from "prop-types"

import FormControl from "@material-ui/core/FormControl"
import FormLabel from "@material-ui/core/FormLabel"
import FormHelperText from "@material-ui/core/FormHelperText"
import Button from "@material-ui/core/Button"

import useStyles from "./styles"
import useStrings from "useStrings"

function CookieConsent({cookieConsent, setCookieConsent}) {
  const styles = useStyles()
  const strings = useStrings().header.preferences.cookieConsent
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
        onClick={() => setCookieConsent(!cookieConsent)}
      >
        {strings.action[cookieConsent ? "negative" : "positive"]}
      </Button>
    </FormControl>
  )
}

CookieConsent.propTypes = {
  cookieConsent: PropTypes.bool,
  setCookieConsent: PropTypes.func.isRequired,
}

export default CookieConsent
