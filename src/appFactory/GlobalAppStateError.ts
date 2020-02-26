export enum GlobalAppStateErrors {
  NON_UNIQUE_KEY,
  PROPERTY_CONSTRUCTION_ERROR,
  AMBIGUOUS_IS_SERIALIZABLE,
  AMBIGUOUS_IS_ASYNC,
}

class GlobalAppStateError extends Error {
  constructor(error?: GlobalAppStateErrors, key?: string) {
    super(
      error ?
        key ?
          `[${key}]: ${GlobalAppStateError.message(error)}` :
          GlobalAppStateError.message(error) :
        undefined,
    )
  }

  static warn(error: GlobalAppStateErrors, key?: string): void {
    console.warn(
      key ?
        `[${key}]: ${GlobalAppStateError.message(error)}` :
        GlobalAppStateError.message(error),
    )
  }

  static message(message: GlobalAppStateErrors): string {
    switch (message) {
      case GlobalAppStateErrors.NON_UNIQUE_KEY:
        return "This key (in singular or plural form or the setter function name generated based on this key) already refers to another global app state property."
      case GlobalAppStateErrors.PROPERTY_CONSTRUCTION_ERROR:
        return "defaultValue must exist in defaultValues when defining a global app state property."
      case GlobalAppStateErrors.AMBIGUOUS_IS_SERIALIZABLE:
        return "controlContext.isSerializable is true but controlContext.transformValue is not defined."
      case GlobalAppStateErrors.AMBIGUOUS_IS_ASYNC:
        return "controlContext.isAsync is true but controlContext.transformValue is not defined."
    }
  }
}

export default GlobalAppStateError
