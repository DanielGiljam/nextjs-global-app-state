import {IncomingMessage} from "http"

import {Context, Provider} from "react"

import {Cookies, CookieConsent} from "../util/cookies"

export type GlobalAppStatePropertyValue = string | number | boolean | null

export interface GlobalAppStatePropertyParameters<
  T = GlobalAppStatePropertyValue,
  C = T
> {
  key: string;
  keyPlural?: string;
  defaultValue: T;
  defaultValues: Set<T>;
  initializeValue?: {
    serverSide?(
      values: Set<T>,
      cookies: Cookies,
      req: IncomingMessage
    ): Promise<T>;
    clientSide?(values: Set<T>, existingValue: T): Promise<T>;
  };
  getValues?: {
    serverSide?(): Promise<Set<T>>;
    clientSide?(): Promise<Set<T>>;
  };
  setValue?(
    values: Set<T>,
    cookieConsent: CookieConsent,
    value: T
  ): Promise<void>;
  isSensitiveInformation?: boolean;
  controlContext?: {
    transformValue?(value: T): Promise<C>;
    isSerializable?: boolean;
    context?: Context<C>;
    ContextProvider?: Provider<C>;
  };
}

export type DehydratedGlobalAppStateProperty<
  T = GlobalAppStatePropertyValue,
  C = T
> = {
  value: T;
  values: T[];
  // TODO: come up with a better type for serializedContext!
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serializedContext?: C;
}

export type HydratedGlobalAppStatePropertyType<
  T = GlobalAppStatePropertyValue
> =
  | T
  | Set<T>
  | ((values: Set<T>, cookieConsent: CookieConsent, value: T) => Promise<void>)

class GlobalAppStateProperty<T = GlobalAppStatePropertyValue, C = T> {
  readonly key: string

  private readonly customKeyPlural?: string
  private readonly defaultValue: T
  private readonly defaultValues: Set<T>
  private readonly initializeValue?: {
    serverSide?(
      values: Set<T>,
      cookies: Cookies,
      req: IncomingMessage
    ): Promise<T>;
    clientSide?(values: Set<T>, existingValue: T): Promise<T>;
  }
  private readonly getValues?: {
    serverSide?(): Promise<Set<T>>;
    clientSide?(): Promise<Set<T>>;
  }
  private setValue?(
    values: Set<T>,
    cookieConsent: CookieConsent,
    value: T
  ): Promise<void>
  private readonly isSensitiveInformation?: boolean
  private readonly controlContext?: {
    transformValue?(value: T): Promise<C>;
    isSerializable?: boolean;
    context?: Context<C>;
    ContextProvider?: Provider<C>;
  }

  private state: {
    value: T;
    values: Set<T>;
    serializedContext?: C;
  }

  constructor({
    key,
    keyPlural,
    defaultValue,
    defaultValues,
    ...parameters
  }: GlobalAppStatePropertyParameters<T, C>) {
    if (defaultValues.has(defaultValue)) {
      this.key = key
      this.customKeyPlural = keyPlural
      this.defaultValue = defaultValue
      this.defaultValues = defaultValues
      this.state = {
        value: defaultValue,
        values: defaultValues,
      }
      Object.entries(parameters).forEach(([key, value]) => {
        this[key as keyof this] = value
      })
    } else {
      throw new Error(
          "defaultValue must exist in defaultValues when defining a global app state property!",
      )
    }
  }

  inject({
    value,
    values,
    serializedContext,
  }: DehydratedGlobalAppStateProperty<T, C>): void {
    this.state = {
      value,
      values: new Set<T>(values),
      serializedContext,
    }
  }

  get value(): T | Promise<T> {
    // TODO: implement "value" getter in GlobalAppStateProperty!
    return this.state.value
  }

  get keyPlural(): string {
    // TODO: implement "keyPlural" getter in GlobalAppStateProperty!
    return this.customKeyPlural || this.key + "s"
  }

  get values(): Set<T> | Promise<Set<T>> {
    // TODO: implement "values" getter in GlobalAppStateProperty!
    return this.state.values
  }

  get setterName(): string {
    return this.key.replace(/^./, (match) => `set${match.toUpperCase()}`)
  }

  get setter():
    | ((
        values: Set<T>,
        cookieConsent: CookieConsent,
        value: T
      ) => Promise<void>)
    | Promise<
        (
          values: Set<T>,
          cookieConsent: CookieConsent,
          value: T
        ) => Promise<void>
        > {
    if (this.setValue) {
      return this.setValue
    }
    return async (
      values: Set<T>,
      cookieConsent: CookieConsent,
      value: T,
    ): Promise<void> => {
      // TODO: implement GlobalAppStateProperty setters!
      console.log("GlobalAppStateProperty setters aren't implemented yet.")
    }
  }

  get ContextProvider(): Provider<C> | null {
    return (
      this.controlContext?.ContextProvider ||
      this.controlContext?.context?.Provider ||
      null
    )
  }

  static async getValueServerSide(
      property: GlobalAppStatePropertyParameters,
      values: Set<GlobalAppStatePropertyValue>,
      cookies: Cookies,
      req: IncomingMessage,
  ): Promise<GlobalAppStatePropertyValue> {
    return property.initializeValue?.serverSide ?
      await property.initializeValue.serverSide(values, cookies, req) :
      property.defaultValue
  }

  static async getValuesServerSide(
      property: GlobalAppStatePropertyParameters,
  ): Promise<Set<GlobalAppStatePropertyValue>> {
    return property.getValues?.serverSide ?
      await property.getValues.serverSide() :
      property.defaultValues
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async serializeContext<T = any>(
      controlContext: GlobalAppStatePropertyParameters<
      GlobalAppStatePropertyValue,
      T
    >["controlContext"],
      value: GlobalAppStatePropertyValue,
      key: string,
  ): Promise<T | null> {
    if (controlContext?.isSerializable) {
      if (controlContext.transformValue) {
        return await controlContext.transformValue(value)
      }
      console.warn(
          `GlobalAppState.${key}: controlContext.isSerializable is true but controlContext.transformValue is not defined!`,
      )
    }
    return null
  }
}

export default GlobalAppStateProperty
