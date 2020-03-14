import PropTypes from "prop-types"

import Menu from "@material-ui/core/Menu"
import MenuItem from "@material-ui/core/MenuItem"

import Lang from "./lang"
import Theme from "./theme"
import CookieConsent from "./cookie-consent"

import useGlobalAppState from "useGlobalAppState"

function Preferences({anchor, setAnchor}) {
  const {
    lang,
    languages,
    setLang,
    theme,
    themes,
    setTheme,
    cookieConsent,
    setCookieConsent,
  } = useGlobalAppState()
  return (
    <Menu
      id={"preferences"}
      open={!!anchor}
      onClose={() => setAnchor(null)}
      anchorEl={anchor}
      keepMounted
    >
      <MenuItem button={false} style={{outline: "none"}}>
        <Lang lang={lang} languages={Array.from(languages)} setLang={setLang} />
      </MenuItem>
      <MenuItem button={false} style={{outline: "none"}}>
        <Theme theme={theme} themes={Array.from(themes)} setTheme={setTheme} />
      </MenuItem>
      <MenuItem button={false} style={{outline: "none"}}>
        <CookieConsent
          cookieConsent={cookieConsent}
          setCookieConsent={setCookieConsent}
        />
      </MenuItem>
    </Menu>
  )
}

Preferences.propTypes = {
  anchor: PropTypes.any,
  setAnchor: PropTypes.func.isRequired,
}

export default Preferences
