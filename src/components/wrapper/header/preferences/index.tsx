import React from "react"

import Menu from "@material-ui/core/Menu"
import MenuItem from "@material-ui/core/MenuItem"

import Lang from "./lang"
import Theme from "./theme"
import CookieConsent from "./cookie-consent"

import {Anchor} from "../index"

interface PreferencesProps {
  anchor: Anchor;
  setAnchor: (anchor: Anchor) => void;
}

function Preferences({anchor, setAnchor}: PreferencesProps): JSX.Element {
  return (
    <Menu
      id={"preferences"}
      open={!!anchor}
      onClose={(): void => setAnchor(undefined)}
      anchorEl={anchor}
      keepMounted
    >
      <MenuItem button={false} style={{outline: "none"}}>
        <Lang />
      </MenuItem>
      <MenuItem button={false} style={{outline: "none"}}>
        <Theme />
      </MenuItem>
      <MenuItem button={false} style={{outline: "none"}}>
        <CookieConsent />
      </MenuItem>
    </Menu>
  )
}

export default Preferences
