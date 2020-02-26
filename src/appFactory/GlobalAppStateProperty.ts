import {IncomingMessage} from "http"

import {Context, Provider} from "react"

import {Cookies, CookieConsent} from "../util/cookies"

export type PropertyValueType = any // eslint-disable-line @typescript-eslint/no-explicit-any

export type ContextValueType = any // eslint-disable-line @typescript-eslint/no-explicit-any

export type GlobalAppStatePropertySetter<
  T = PropertyValueType,
  C = ContextValueType
> = (
  values: Set<T>,
  cookieConsent: CookieConsent,
  value: T
) => Promise<C | undefined>

export type GlobalAppStatePropertySetterProxy<T = PropertyValueType> = (
  value: T
) => void

export interface GlobalAppStatePropertyParameters<
  T = PropertyValueType,
  C = ContextValueType
> {
  key: string;
  keyPlural?: string;
  defaultValue: T;
  defaultValues: Set<T>;
  initializeValue?: {
    serverSide?(
      values?: Set<T>,
      cookies?: Cookies,
      req?: IncomingMessage
    ): Promise<T>;
    clientSide?(values?: Set<T>, existingValue?: T): Promise<T>;
  };
  getValues?: {
    serverSide?(): Promise<Set<T>>;
    clientSide?(): Promise<Set<T>>;
  };
  setValue?: GlobalAppStatePropertySetter<T, C>;
  isSensitiveInformation?: boolean;
  controlContext?: {
    transformValue?(value: T): C | Promise<C>;
    isAsync?: boolean;
    isSerializable?: boolean;
    context?: Context<C>;
    ContextProvider?: Provider<C>;
  };
}

export interface DehydratedGlobalAppStateProperty<
  T = PropertyValueType,
  C = ContextValueType
> {
  value: T;
  values: T[];
  serializedContext?: C;
}

export type HydratedGlobalAppStatePropertyType<
  T = PropertyValueType,
  C = ContextValueType
> = T | Set<T> | GlobalAppStatePropertySetterProxy<T>

class GlobalAppStateProperty<T = PropertyValueType, C = ContextValueType> {
  readonly key: string

  private readonly customKeyPlural?: string
  private readonly defaultValue: T
  private readonly defaultValues: Set<T>
  private readonly initializeValue?: {
    serverSide?(
      values?: Set<T>,
      cookies?: Cookies,
      req?: IncomingMessage
    ): Promise<T>;
    clientSide?(values?: Set<T>, existingValue?: T): Promise<T>;
  }
  private readonly getValues?: {
    serverSide?(): Promise<Set<T>>;
    clientSide?(): Promise<Set<T>>;
  }
  private readonly setValue?: GlobalAppStatePropertySetter<T, C>
  private readonly isSensitiveInformation?: boolean
  private readonly controlContext?: {
    transformValue?(value: T): C | Promise<C>;
    isAsync?: boolean;
    isSerializable?: boolean;
    context?: Context<C>;
    ContextProvider?: Provider<C>;
  }

  private state: {
    value: T;
    values: Set<T>;
    contextValue?: C;
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

  injectDehydratedState({
    value,
    values,
    serializedContext,
  }: DehydratedGlobalAppStateProperty<T, C>): void {
    this.state = {
      value,
      values: new Set<T>(values),
      contextValue: serializedContext,
    }
    if (
      !this.controlContext?.isSerializable &&
      !this.controlContext?.isAsync &&
      this.controlContext?.transformValue
    ) {
      this.state.contextValue = this.controlContext.transformValue(value) as C
    }
  }

  async initializeStateClientSide(): Promise<void> {
    // TODO: implement initializeStateClientSide -method in GlobalAppStateProperty!
  }

  get value(): T {
    return this.state.value
  }

  get keyPlural(): string {
    return this.customKeyPlural || this.key + "s"
  }

  get values(): Set<T> {
    return this.state.values
  }

  get setterName(): string {
    return this.key.replace(/^./, (match) => `set${match.toUpperCase()}`)
  }

  get setter(): GlobalAppStatePropertySetter<T, C> {
    if (this.setValue && this.controlContext?.transformValue) {
      const setValue = this.setValue
      if (this.controlContext?.transformValue) {
        const transformValue = this.controlContext?.transformValue
        return (
            values: Set<T>,
            cookieConsent: CookieConsent,
            value,
        ): Promise<C> =>
          setValue(values, cookieConsent, value).then(() =>
            transformValue(value),
          )
      }
      return setValue
    }
    return async (): Promise<undefined> => undefined
  }

  get contextValue(): C | undefined {
    return this.state.contextValue
  }

  get ContextProvider(): Provider<C> | undefined {
    return (
      this.controlContext?.ContextProvider ||
      this.controlContext?.context?.Provider ||
      undefined
    )
  }

  static async getValueServerSide<T>(
      property: GlobalAppStatePropertyParameters<T>,
      values: Set<T>,
      cookies: Cookies,
      req: IncomingMessage,
  ): Promise<T> {
    return property.initializeValue?.serverSide ?
      await property.initializeValue.serverSide(values, cookies, req) :
      property.defaultValue
  }

  static async getValuesServerSide<T>(
      property: GlobalAppStatePropertyParameters<T>,
  ): Promise<Set<T>> {
    return property.getValues?.serverSide ?
      await property.getValues.serverSide() :
      property.defaultValues
  }

  static async serializeContext<T, C>(
      controlContext: GlobalAppStatePropertyParameters<T, C>["controlContext"],
      value: T,
      key: string,
  ): Promise<C | undefined> {
    if (controlContext?.isSerializable) {
      if (controlContext.transformValue) {
        return await controlContext.transformValue(value)
      }
      console.warn(
          `GlobalAppState.${key}: controlContext.isSerializable is true but controlContext.transformValue is not defined!`,
      )
      return (value as unknown) as C
    }
    return undefined
  }
}

export default GlobalAppStateProperty
