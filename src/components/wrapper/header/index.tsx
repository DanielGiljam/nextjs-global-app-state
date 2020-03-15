import Head from "next/head"
import Link from "next/link"

import React, {useState} from "react"

import AppBar from "@material-ui/core/AppBar"
import Toolbar from "@material-ui/core/Toolbar"
import Typography from "@material-ui/core/Typography"
import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import SettingsRoundedIcon from "@material-ui/icons/SettingsRounded"

import Preferences from "./preferences"

import useStrings from "../../../useStrings"

import ucFirst from "../../../util/strings/ucFirst"

export type Anchor = (EventTarget & HTMLButtonElement) | undefined

function Header(): JSX.Element {
  const strings = useStrings()
  const [preferencesAnchor, setPreferencesAnchor] = useState<Anchor>(undefined)
  return (
    <>
      <Head>
        <title>{strings.general.siteName}</title>
        <meta name={"description"} content={strings.general.description} />
      </Head>
      <AppBar position={"static"}>
        <Toolbar>
          <Typography component={"h1"} variant={"h6"} style={{flexGrow: 1}}>
            {strings.general.siteName}
          </Typography>
          <Link href={{pathname: "/"}} passHref>
            <Button component={"a"} color={"inherit"}>
              {ucFirst(strings.general.pageNames.home)}
            </Button>
          </Link>
          <Link href={{pathname: "/about"}} passHref>
            <Button component={"a"} color={"inherit"}>
              {ucFirst(strings.general.pageNames.about)}
            </Button>
          </Link>
          <IconButton
            onClick={(event): void => setPreferencesAnchor(event.currentTarget)}
            color={"inherit"}
            aria-controls={"preferences"}
            aria-haspopup={"true"}
          >
            <SettingsRoundedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Preferences
        anchor={preferencesAnchor}
        setAnchor={setPreferencesAnchor}
      />
    </>
  )
}

export default Header
