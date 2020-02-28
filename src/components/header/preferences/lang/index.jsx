import PropTypes from "prop-types"

import FormControl from "@material-ui/core/FormControl"
import FormLabel from "@material-ui/core/FormLabel"
import ToggleButton from "@material-ui/lab/ToggleButton"
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup"

import useStyles from "./styles"
import useStrings from "useStrings"

function Lang({lang, languages, setLang}) {
  const styles = useStyles()
  const strings = useStrings().header.preferences.lang
  return (
    <FormControl component={"fieldset"}>
      <FormLabel className={styles.legend} component={"legend"}>
        {strings.label}
      </FormLabel>
      <ToggleButtonGroup
        className={styles.toggleButtonGroup}
        onChange={(_event, value) => setLang(value)}
        exclusive
        value={lang}
      >
        {languages.map((theme) => (
          <ToggleButton key={theme} value={theme}>
            {strings.option[theme]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  )
}

Lang.propTypes = {
  lang: PropTypes.string.isRequired,
  languages: PropTypes.arrayOf(PropTypes.string).isRequired,
  setLang: PropTypes.func.isRequired,
}

export default Lang
