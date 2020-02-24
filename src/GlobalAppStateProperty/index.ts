import {Context, Provider} from "react"
import {Cookies, CookieConsent} from "util/cookies"
import {IncomingMessage} from "http"

export interface GlobalAppStatePropertyParameters<T, C = T> {
  key: string;
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

class GlobalAppStateProperty<T, C = T> {
  private readonly key: string
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
    lang: T
  ): Promise<void>
  private readonly isSensitiveInformation?: boolean
  private readonly controlContext?: {
    transformValue?(value: T): Promise<C>;
    isSerializable?: boolean;
    context?: Context<C>;
    ContextProvider?: Provider<C>;
  }

  constructor({
    key,
    defaultValue,
    defaultValues,
    ...parameters
  }: GlobalAppStatePropertyParameters<T, C>) {
    if (defaultValues.has(defaultValue)) {
      this.key = key
      this.defaultValue = defaultValue
      this.defaultValues = defaultValues
      Object.entries(parameters).forEach(([key, value]) => {
        this[key as keyof this] = value
      })
    } else {
      throw new Error(
          "defaultValue must exist in defaultValues when defining a global app state property!",
      )
    }
  }

  get ContextProvider(): Provider<C> | null {
    return (
      this.controlContext?.ContextProvider ||
      this.controlContext?.context?.Provider ||
      null
    )
  }
}

export default GlobalAppStateProperty
