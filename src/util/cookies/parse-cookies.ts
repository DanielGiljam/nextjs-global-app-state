import {Cookies} from "./index"

function parseCookies(cookieString = ""): Cookies {
  const parsedCookies: Cookies = {}
  const regExp = /([^=]+)=([^;,]+)(?:[;,] ?)?/g
  let array
  while ((array = regExp.exec(cookieString))) {
    parsedCookies[array[1]] = array[2]
  }
  return parsedCookies
}

export default parseCookies
