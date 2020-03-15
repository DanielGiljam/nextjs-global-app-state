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
          "format() was called with too many arguments. " +
          `Template: "${template}". substitutions: ${substitutions.join(", ")}.`,
      )
    }
    formattedString = newFormattedString
  }
  if (regExp.test(formattedString)) {
    throw new Error(
        "format() was called with too few arguments. " +
        `Template: "${template}". substitutions: ${substitutions.join(", ")}.`,
    )
  }
  return formattedString
}

export default format
