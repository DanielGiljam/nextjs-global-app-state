import PropTypes from "prop-types"

import FormControl from "@material-ui/core/FormControl"
import FormLabel from "@material-ui/core/FormLabel"
import ToggleButton from "@material-ui/lab/ToggleButton"
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup"

import useStyles from "./styles"
import useStrings from "useStrings"

function Theme({theme, themes, setTheme}) {
  const styles = useStyles()
  const strings = useStrings().header.preferences.theme
  return (
    <FormControl component={"fieldset"}>
      <FormLabel className={styles.legend} component={"legend"}>
        {strings.label}
      </FormLabel>
      <ToggleButtonGroup
        className={styles.toggleButtonGroup}
        onChange={(_event, value) => setTheme(value)}
        exclusive
        value={theme}
      >
        {themes.map((theme) => (
          <ToggleButton key={theme} value={theme}>
            {strings.option[theme]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  )
}

Theme.propTypes = {
  theme: PropTypes.string.isRequired,
  themes: PropTypes.arrayOf(PropTypes.string).isRequired,
  setTheme: PropTypes.func.isRequired,
}

export default Theme
