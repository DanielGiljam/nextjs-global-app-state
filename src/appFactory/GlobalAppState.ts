import {IncomingMessage} from "http"

import {Provider} from "react"

import GlobalAppStateProperty, {
  ContextValueType,
  GlobalAppStatePropertySetter,
  GlobalAppStatePropertySetterProxy,
  GlobalAppStatePropertyParameters,
  DehydratedGlobalAppStateProperty,
  HydratedGlobalAppStatePropertyType,
} from "./GlobalAppStateProperty"

import parseCookies from "../util/cookies/parse-cookies"

import cookieConsent from "../cookieConsent"

type DehydratedProperties = GlobalAppStatePropertyParameters[]
type HydratedProperties = Map<string, GlobalAppStateProperty>

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

export type PropertySettersBuildType = {
  [key: string]:
    | GlobalAppStatePropertySetterProxy
    | GlobalAppStatePropertySetter;
}

class GlobalAppState {
  private dehydratedProperties: DehydratedProperties
  private hydratedProperties?: HydratedProperties

  constructor(properties: DehydratedProperties = []) {
    this.dehydratedProperties = [...properties, cookieConsent]
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
    const [propertyKeys, propertyKeysPlural, setterNames]: [
      string[],
      string[],
      string[]
    ] = [[], [], []]
    this.properties.forEach((property) => {
      propertyKeys.push(property.key)
      propertyKeysPlural.push(property.keyPlural)
      setterNames.push(property.setterName)
    })
    return [propertyKeys, propertyKeysPlural, setterNames]
  }

  async initializeStateServerSide(
      req: IncomingMessage,
  ): Promise<DehydratedState> {
    const cookies = parseCookies(req.headers["cookie"])
    const dehydratedStatePropertyPromises = this.dehydratedProperties.map(
        (property) =>
          (async (): Promise<
          DehydratedGlobalAppStateProperty & {key: string}
        > => {
            const values = await GlobalAppStateProperty.getValuesServerSide(
                property,
            )
            const value = await GlobalAppStateProperty.getValueServerSide(
                property,
                values,
                cookies,
                req,
            )
            return {
              key: property.key,
              value,
              values: Array.from(values),
              serializedContext: await GlobalAppStateProperty.serializeContext(
                  property.controlContext,
                  value,
                  property.key,
              ),
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
    const hydratedStateChunks = Array.from(this.properties, ([, property]): [
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
      globalAppState: Object.fromEntries([...hydratedStateChunks]),
      ...Object.fromEntries([...hydratedContexts]),
    }
  }

  async initializeStateClientSidePhase2(
      hydratedState: HydratedState,
  ): Promise<HydratedState | undefined> {
    const initializedContexts: [string, ContextValueType?][] = []
    const initializedStateChunkPromises = Array.from(
        this.properties,
        ([, property]) =>
          (async (): Promise<[string, HydratedGlobalAppStatePropertyType][]> => {
            await property.initializeStateClientSide()
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

  getSetters(): PropertySettersBuildType {
    const setters: PropertySettersBuildType = {}
    this.properties.forEach(
        (property) => (setters[property.setterName] = property.setter),
    )
    return setters
  }

  private get properties(): HydratedProperties {
    return (
      this.hydratedProperties ||
      (this.hydratedProperties = new Map(
          this.dehydratedProperties.map((property) => [
            property.key,
            new GlobalAppStateProperty(property),
          ]),
      ))
    )
  }
}

export default GlobalAppState
