function setCookie(key: string, value: string): void {
  document.cookie = `${key}=${value};max-age=31536000` // 31 536 000 seconds = 1 year
}

export default setCookie
