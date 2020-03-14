function lcFirst(this: string): string {
  // eslint-disable-next-line no-invalid-this
  return this.replace(/^./, (match) => match.toLowerCase())
}

function ucFirst(this: string): string {
  // eslint-disable-next-line no-invalid-this
  return this.replace(/^./, (match) => match.toUpperCase())
}

function format(template: string, ...substitutions: string[]): string {
  const regExp = /([^\\])%s/
  let formattedString = template
  for (const substitution of substitutions) {
    const newFormattedString = formattedString.replace(
        regExp,
        `$1${substitution}`,
    )
    if (formattedString === newFormattedString) {
      console.error(
          "String.format() was called with too many arguments. " +
          `Template: "${template}". substitutions: ${substitutions.join(", ")}.`,
      )
    }
    formattedString = newFormattedString
  }
  if (regExp.test(formattedString)) {
    throw new Error(
        "String.format() was called with too few arguments. " +
        `Template: "${template}". substitutions: ${substitutions.join(", ")}.`,
    )
  }
  return formattedString
}

function extendStringClass(): void {
  Object.defineProperties(String, {
    format: {configurable: true, value: format, writable: true},
  })
  // eslint-disable-next-line no-extend-native
  Object.defineProperties(String.prototype, {
    ucFirst: {configurable: true, value: ucFirst, writable: true},
    lcFirst: {configurable: true, value: lcFirst, writable: true},
  })
}

export default extendStringClass
