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
    const dehydratedStatePropertyPromises = this.properties.map((property) =>
      (async (): Promise<DehydratedGlobalAppStateProperty & {key: string}> => {
        await property.initializeStateServerSide(cookies, req)
        return {
          key: property.key,
          value: property.value,
          values: Array.from(property.values),
          serializedContext: property.contextValue,
        }
      })(),
    )
    return await Promise.all(dehydratedStatePropertyPromises).then(
        (dehydratedStateProperties) => {
          const dehydratedState: DehydratedState = {}
          dehydratedStateProperties.forEach((property) => {
            dehydratedState[property.key] = property
          })
          return dehydratedState
        },
    )
  }

  initializeStateClientSidePhase1(
      dehydratedState: DehydratedState,
  ): HydratedState {
    const hydratedContexts: [string, ContextValueType?][] = []
    const hydratedStateChunks = this.properties.map((property): [
      string,
      HydratedGlobalAppStatePropertyType
    ][] => {
      property.injectDehydratedState(dehydratedState[property.key])
      hydratedContexts.push([property.key, property.contextValue])
      return [
        [property.key, property.value],
        [property.keyPlural, property.values],
      ]
    })
    return {
      globalAppState: Object.fromEntries(hydratedStateChunks.flat()),
      ...Object.fromEntries(hydratedContexts.flat()),
    }
  }

  async initializeStateClientSidePhase2(
      hydratedState: HydratedState,
  ): Promise<HydratedState | undefined> {
    const initializedContexts: [string, ContextValueType?][] = []
    const initializedStateChunkPromises = this.properties.map((property) =>
      (async (): Promise<[string, HydratedGlobalAppStatePropertyType][]> => {
        await property.initializeStateClientSide(
            hydratedState.globalAppState[property.key],
            hydratedState.globalAppState[property.keyPlural],
            hydratedState[property.key],
        )
        initializedContexts.push([property.key, property.contextValue])
        return [
          [property.key, property.value],
          [property.keyPlural, property.values],
        ]
      })(),
    )
    return await Promise.all(initializedStateChunkPromises).then(
        (initializedStateChunks) => {
          const initializedState = initializedStateChunks
              .flat()
              .filter(([key, value]) => {
                if (value instanceof Set) {
                  return (
                    value.size === hydratedState[key].size &&
                Array.from(value).every((v) => hydratedState[key].has(v))
                  )
                } else {
                  return value === hydratedState[key]
                }
              })
          if (initializedState.length || initializedContexts.length) {
            return {
              globalAppState: Object.entries(initializedState),
              ...Object.fromEntries(initializedContexts),
            }
          }
          return undefined
        },
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
