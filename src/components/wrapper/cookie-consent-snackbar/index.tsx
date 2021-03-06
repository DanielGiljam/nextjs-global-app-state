import React from "react"

import Button from "@material-ui/core/Button"
import Snackbar from "@material-ui/core/Snackbar"

import useStyles from "./styles"
import useStrings from "../../../useStrings"
import useGlobalAppState from "../../../useGlobalAppState"

function CookieConsentSnackbar(): JSX.Element {
  const styles = useStyles()
  const strings = useStrings().cookieConsentSnackbar
  const {cookieConsent, setCookieConsent} = useGlobalAppState()
  return (
    <Snackbar
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      open={cookieConsent == null}
      message={strings.message}
      action={
        <>
          <Button
            className={styles.buttonPositive}
            onClick={(): void => setCookieConsent(true)}
          >
            {strings.yes}
          </Button>
          <Button
            className={styles.buttonNegative}
            onClick={(): void => setCookieConsent(false)}
          >
            {strings.no}
          </Button>
        </>
      }
    />
  )
}

export default CookieConsentSnackbar
