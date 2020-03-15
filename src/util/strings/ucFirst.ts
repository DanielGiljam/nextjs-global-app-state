function ucFirst(string: string): string {
  return string.replace(/^./, (match) => match.toUpperCase())
}

export default ucFirst
