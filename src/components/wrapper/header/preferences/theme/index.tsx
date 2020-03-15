import React from "react"

import FormControl from "@material-ui/core/FormControl"
import FormLabel from "@material-ui/core/FormLabel"
import ToggleButton from "@material-ui/lab/ToggleButton"
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup"

import useStyles from "./styles"
import useStrings from "../../../../../useStrings"
import useGlobalAppState from "../../../../../useGlobalAppState"

function Theme(): JSX.Element {
  const styles = useStyles()
  const strings = useStrings().header.preferences.theme
  const {theme, themes, setTheme} = useGlobalAppState()
  return (
    <FormControl component={"fieldset"}>
      <FormLabel className={styles.legend} component={"legend"}>
        {strings.label}
      </FormLabel>
      <ToggleButtonGroup
        className={styles.toggleButtonGroup}
        onChange={(_event, value): void => setTheme(value)}
        exclusive
        value={theme}
      >
        {Array.from(themes).map((theme) => (
          <ToggleButton key={theme as string} value={theme}>
            {strings.option[theme as string]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  )
}

export default Theme
