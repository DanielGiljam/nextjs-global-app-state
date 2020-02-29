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
  private readonly propertyKeys: string[] = []
  private readonly propertyKeysPlural: string[] = []
  private readonly setterNames: string[] = []

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

  getPropertyKeys(): [string[], string[], string[]] {
    return [this.propertyKeys, this.propertyKeysPlural, this.setterNames]
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
    let key: string
    this.properties.forEach((property) => {
      key = property.key
      property.injectDehydratedState(dehydratedState[key])
      hydratedState.globalAppState[key] = property.value
      hydratedState.globalAppState[property.keyPlural] = property.values
      hydratedState[key] = property.contextValue
    })
    return hydratedState
  }

  async initializeStateClientSidePhase2(
      hydratedState: HydratedState,
  ): Promise<HydratedState | undefined> {
    const deltaState: HydratedState = {globalAppState: {}}
    let key: string
    let keyPlural: string
    const phase2InitializationPromises = this.properties.map((property) =>
      (async (): Promise<void> => {
        key = property.key
        keyPlural = property.keyPlural
        await property.initializeStateClientSide(
            hydratedState.globalAppState[key],
            hydratedState.globalAppState[keyPlural],
        )
        if (property.value !== hydratedState.globalAppState[key]) {
          deltaState.globalAppState[key] = property.value
        }
        if (
          property.values.size !==
            hydratedState.globalAppState[keyPlural].size ||
          !Array.from(property.values).every((value) =>
            hydratedState.globalAppState[keyPlural].has(value),
          )
        ) {
          deltaState.globalAppState[keyPlural] = property.values
        }
        if (typeof property.contextValue !== "undefined") {
          deltaState[key] = property.contextValue
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
