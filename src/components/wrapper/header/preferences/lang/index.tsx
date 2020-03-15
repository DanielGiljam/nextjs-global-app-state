import React from "react"

import FormControl from "@material-ui/core/FormControl"
import FormLabel from "@material-ui/core/FormLabel"
import ToggleButton from "@material-ui/lab/ToggleButton"
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup"

import useStyles from "./styles"
import useStrings from "../../../../../useStrings"
import useGlobalAppState from "../../../../../useGlobalAppState"

function Lang(): JSX.Element {
  const styles = useStyles()
  const strings = useStrings().header.preferences.lang
  const {lang, languages, setLang} = useGlobalAppState()
  return (
    <FormControl component={"fieldset"}>
      <FormLabel className={styles.legend} component={"legend"}>
        {strings.label}
      </FormLabel>
      <ToggleButtonGroup
        className={styles.toggleButtonGroup}
        onChange={(_event, value): void => setLang(value)}
        exclusive
        value={lang}
      >
        {Array.from(languages).map((lang) => (
          <ToggleButton key={lang as string} value={lang}>
            {strings.option[lang as string]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  )
}

export default Lang
