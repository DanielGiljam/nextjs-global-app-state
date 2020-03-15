import {IncomingMessage} from "http"

import {Provider} from "react"

import {URLParams} from "./index"
import GlobalAppStateProperty, {
  ContextValueType,
  GlobalAppStatePropertySetter,
  GlobalAppStatePropertyParameters,
  DehydratedGlobalAppStateProperty,
  HydratedGlobalAppStatePropertyType,
} from "./GlobalAppStateProperty"

import parseCookies from "../util/cookies/parse-cookies"

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
  _mounted: boolean;
  _ready: boolean;
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
    const uniqueKeys: string[] = ["_mounted", "_ready"]
    let key: string
    let keyPlural: string
    let setterName: string
    let globalAppStateProperty: GlobalAppStateProperty
    properties.forEach((property, index) => {
      try {
        key = property.key
        if (uniqueKeys.includes(key)) {
          throw new Error(
              `[${key}]: This key already refers to another global app state property.`,
          )
        }
        uniqueKeys.push(key)
        globalAppStateProperty = new GlobalAppStateProperty(property)
        this.properties.push(globalAppStateProperty)
        this.propertyKeys.push(key)
        keyPlural = this.properties[index].keyPlural
        setterName = this.properties[index].setterName
        if (uniqueKeys.includes(keyPlural)) {
          throw new Error(
              `[${key}]: This key's plural form "${keyPlural}" already refers to another global app state property.`,
          )
        }
        if (uniqueKeys.includes(setterName)) {
          throw new Error(
              `[${key}]: This key's setterName "${setterName}" already refers to another global app state property.`,
          )
        }
        uniqueKeys.push(keyPlural, setterName)
        this.propertyKeysPlural.push(keyPlural)
        this.setterNames.push(setterName)
      } catch (error) {
        console.error(error.stack)
      }
    })
  }

  getKeysForURLParamListeningProperties(): string[] {
    const keysForURLParamListeningProperties: string[] = []
    this.properties.forEach((property) => {
      if (property.onURLParam) {
        keysForURLParamListeningProperties.push(property.key)
      }
    })
    return keysForURLParamListeningProperties
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
    const hydratedState: HydratedState = {
      globalAppState: {},
      _mounted: false,
      _ready: false,
    }
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
  ): Promise<HydratedState> {
    const deltaState: HydratedState = {
      globalAppState: {},
      _mounted: true,
      _ready: false,
    }
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

  async onURLParamCallback(
      state: HydratedState,
      urlParams: URLParams,
      justReady: boolean,
  ): Promise<HydratedState | undefined> {
    const deltaState: HydratedState = {
      globalAppState: {},
      _mounted: true,
      _ready: true,
    }
    if (justReady) {
      return !state._ready ? deltaState : undefined
    }
    const onURLCallbackPromises = this.properties.map((property) =>
      (async (): Promise<void> => {
        if (typeof urlParams[property.key] !== "undefined") {
          await property.onURLParamCallback(
              state.globalAppState[property.keyPlural],
              state.globalAppState[property.key],
              urlParams[property.key],
          )
          if (property.value !== state.globalAppState[property.key]) {
            deltaState.globalAppState[property.key] = property.value
          }
          if (typeof property.contextValue !== "undefined") {
            deltaState[property.key] = property.contextValue
          }
        }
      })(),
    )
    return await Promise.allSettled(onURLCallbackPromises).then((results) => {
      results.forEach((result) => {
        if (result.status === "rejected") {
          console.error(result.reason.stack)
        }
      })
      return !state._ready ||
        Object.keys(deltaState.globalAppState).length ||
        Object.keys(deltaState).length > 3 ?
        deltaState :
        undefined
    })
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
