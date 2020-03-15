function lcFirst(string: string): string {
  return string.replace(/^./, (match) => match.toLowerCase())
}

export default lcFirst
