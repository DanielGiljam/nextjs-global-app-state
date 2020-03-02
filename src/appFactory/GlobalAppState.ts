import {IncomingMessage} from "http"

import {Provider} from "react"

import GlobalAppStateProperty, {
  ContextValueType,
  GlobalAppStatePropertySetter,
  GlobalAppStatePropertyParameters,
  DehydratedGlobalAppStateProperty,
  HydratedGlobalAppStatePropertyType,
} from "./GlobalAppStateProperty"

import parseCookies from "../util/cookies/parse-cookies"

import GlobalAppStateError, {GlobalAppStateErrors} from "./GlobalAppStateError"

type DehydratedProperties = GlobalAppStatePropertyParameters[]
type HydratedProperties = GlobalAppStateProperty[]

export interface DehydratedState {
  [key: string]: DehydratedGlobalAppStateProperty;
}

export interface GlobalAppStateProxy {
  [key: string]: HydratedGlobalAppStatePropertyType;
}

export interface HydratedState {
  globalAppState: GlobalAppStateProxy;
  [key: string]: ContextValueType;
}

export interface PropertySettersUnderConstruction {
  [key: string]: GlobalAppStatePropertySetter;
}

class GlobalAppState {
  private readonly properties: HydratedProperties = []

  readonly propertyKeys: string[] = []
  readonly propertyKeysPlural: string[] = []
  readonly setterNames: string[] = []

  constructor(properties: DehydratedProperties) {
    const uniqueKeys: string[] = []
    let key: string
    let keyPlural: string
    let setterName: string
    properties.forEach((property, index) => {
      key = property.key
      if (uniqueKeys.includes(key)) {
        throw new GlobalAppStateError(GlobalAppStateErrors.NON_UNIQUE_KEY, key)
      }
      uniqueKeys.push(key)
      this.properties.push(new GlobalAppStateProperty(property))
      this.propertyKeys.push(key)
      keyPlural = this.properties[index].keyPlural
      setterName = this.properties[index].setterName
      if (uniqueKeys.includes(keyPlural) || uniqueKeys.includes(setterName)) {
        throw new GlobalAppStateError(GlobalAppStateErrors.NON_UNIQUE_KEY, key)
      }
      uniqueKeys.push(keyPlural, setterName)
      this.propertyKeysPlural.push(keyPlural)
      this.setterNames.push(setterName)
    })
  }

  getContextKeysAndProviders(): [string[], Provider<ContextValueType>[]] {
    const [contextKeys, providers]: [string[], Provider<ContextValueType>[]] = [
      [],
      [],
    ]
    this.properties.forEach((property) => {
      if (property.ContextProvider) {
        contextKeys.push(property.key)
        providers.push(property.ContextProvider)
      }
    })
    return [contextKeys, providers]
  }

  async initializeStateServerSide(
      req: IncomingMessage,
  ): Promise<DehydratedState> {
    const cookies = parseCookies(req.headers["cookie"])
    const dehydratedState: DehydratedState = {}
    const serverSideInitializationPromises = this.properties.map((property) =>
      (async (): Promise<void> => {
        await property.initializeStateServerSide(cookies, req)
        dehydratedState[property.key] = {
          value: property.value,
          values: Array.from(property.values),
          serializedContext: property.contextValue,
        }
      })(),
    )
    return await Promise.all(serverSideInitializationPromises).then(
        () => dehydratedState,
    )
  }

  initializeStateClientSidePhase1(
      dehydratedState: DehydratedState,
  ): HydratedState {
    const hydratedState: HydratedState = {globalAppState: {}}
    this.properties.forEach((property) => {
      property.injectDehydratedState(dehydratedState[property.key])
      hydratedState.globalAppState[property.key] = property.value
      hydratedState.globalAppState[property.keyPlural] = property.values
      hydratedState[property.key] = property.contextValue
    })
    return hydratedState
  }

  async initializeStateClientSidePhase2(
      hydratedState: HydratedState,
  ): Promise<HydratedState | undefined> {
    const deltaState: HydratedState = {globalAppState: {}}
    const phase2InitializationPromises = this.properties.map((property) =>
      (async (): Promise<void> => {
        await property.initializeStateClientSide(
            hydratedState.globalAppState[property.key],
            hydratedState.globalAppState[property.keyPlural],
        )
        if (property.value !== hydratedState.globalAppState[property.key]) {
          deltaState.globalAppState[property.key] = property.value
        }
        if (
          property.values.size !==
            hydratedState.globalAppState[property.keyPlural].size ||
          !Array.from(property.values).every((value) =>
            hydratedState.globalAppState[property.keyPlural].has(value),
          )
        ) {
          deltaState.globalAppState[property.keyPlural] = property.values
        }
        if (typeof property.contextValue !== "undefined") {
          deltaState[property.key] = property.contextValue
        }
      })(),
    )
    return await Promise.all(phase2InitializationPromises).then(
        () => deltaState,
    )
  }

  getSetters(): PropertySettersUnderConstruction {
    const setters: PropertySettersUnderConstruction = {}
    this.properties.forEach(
        (property) => (setters[property.setterName] = property.setter),
    )
    return setters
  }
}

export default GlobalAppState
