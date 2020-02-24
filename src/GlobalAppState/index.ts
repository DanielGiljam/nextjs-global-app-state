import {IncomingMessage} from "http"

import GlobalAppStateProperty, {
  GlobalAppStatePropertyParameters,
  DehydratedGlobalAppStateProperty,
  HydratedGlobalAppStatePropertyType,
} from "GlobalAppStateProperty"

import parseCookies from "../util/cookies/parse-cookies"

type DehydratedProperties = GlobalAppStatePropertyParameters[]
type HydratedProperties = Map<string, GlobalAppStateProperty>

export interface DehydratedState {
  [key: string]: DehydratedGlobalAppStateProperty;
}

export interface HydratedState {
  [key: string]: HydratedGlobalAppStatePropertyType;
}

class GlobalAppState {
  private dehydratedProperties: DehydratedProperties
  private hydratedProperties?: HydratedProperties

  constructor(properties: DehydratedProperties) {
    this.dehydratedProperties = properties
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

  async initializeStateClientSide(
      dehydratedState: DehydratedState,
  ): Promise<HydratedState> {
    const hydratedStateChunkPromises = Array.from(
        this.properties,
        ([, property]) =>
          (async (): Promise<[string, HydratedGlobalAppStatePropertyType][]> => {
            property.inject(dehydratedState[property.key])
            return [
              [property.key, await property.value],
              [property.keyPlural, await property.values],
              [property.setterName, await property.setter],
            ]
          })(),
    )
    return await Promise.all(hydratedStateChunkPromises).then(
        (hydratedStateChunks) => {
          return Object.fromEntries([...hydratedStateChunks])
        },
    )
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
