import {IncomingMessage} from "http"

import {Context, Provider} from "react"

import GlobalAppStateError, {GlobalAppStateErrors} from "./GlobalAppStateError"

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
) => Promise<C | void>

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

export type HydratedGlobalAppStatePropertyType<T = PropertyValueType> =
  | T
  | Set<T>
  | GlobalAppStatePropertySetterProxy<T>

class GlobalAppStateProperty<T = PropertyValueType, C = ContextValueType> {
  readonly key: string
  readonly keyPlural: string
  readonly setterName: string
  readonly isSensitiveInformation?: boolean

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
      this.keyPlural = keyPlural || key + "s"
      this.setterName = key.replace(
          /^./,
          (match) => `set${match.toUpperCase()}`,
      )
      this.state = {
        value: defaultValue,
        values: defaultValues,
      }
      Object.entries(parameters).forEach(([key, value]) => {
        this[key as keyof this] = value
      })
    } else {
      throw new GlobalAppStateError(
          GlobalAppStateErrors.PROPERTY_CONSTRUCTION_ERROR,
          key,
      )
    }
  }

  async initializeStateServerSide(
      cookies: Cookies,
      req: IncomingMessage,
  ): Promise<void> {
    if (this.getValues?.serverSide) {
      this.state.values = await this.getValues.serverSide()
    }
    if (this.initializeValue?.serverSide) {
      this.state.value = await this.initializeValue.serverSide(
          this.state.values,
          cookies,
          req,
      )
    }
    if (this.controlContext?.isSerializable) {
      if (this.controlContext.transformValue) {
        this.state.contextValue = await this.controlContext.transformValue(
            this.state.value,
        )
      } else {
        GlobalAppStateError.warn(
            GlobalAppStateErrors.AMBIGUOUS_IS_SERIALIZABLE,
            this.key,
        )
        this.state.contextValue = (this.state.value as unknown) as C
      }
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
      this.controlContext
    ) {
      if (this.controlContext.transformValue) {
        this.state.contextValue = this.controlContext.transformValue(value) as C
      } else {
        this.state.contextValue = (value as unknown) as C
      }
    }
  }

  async initializeStateClientSide(
      existingValue: T,
      existingValues: Set<T>,
      existingContextValue: C,
  ): Promise<void> {
    if (this.getValues?.clientSide) {
      this.state.values = await this.getValues.clientSide()
    } else {
      this.state.values = existingValues
    }
    if (this.initializeValue?.clientSide) {
      this.state.value = await this.initializeValue.clientSide(
          this.state.values,
          existingValue,
      )
    } else {
      this.state.value = existingValue
    }
    if (!this.controlContext?.isSerializable && this.controlContext?.isAsync) {
      if (this.controlContext.transformValue) {
        this.state.contextValue = await this.controlContext.transformValue(
            this.state.value,
        )
      } else {
        GlobalAppStateError.warn(
            GlobalAppStateErrors.AMBIGUOUS_IS_ASYNC,
            this.key,
        )
        this.state.contextValue =
          existingContextValue || ((this.state.value as unknown) as C)
      }
    }
  }

  get value(): T {
    return this.state.value
  }

  get values(): Set<T> {
    return this.state.values
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
}

export default GlobalAppStateProperty
