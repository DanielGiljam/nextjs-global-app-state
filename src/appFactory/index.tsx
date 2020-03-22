/* eslint-disable react/prop-types */

import {IncomingMessage} from "http"
import {ParsedUrlQuery} from "querystring"

import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import {AppContext, AppInitialProps, AppProps} from "next/app"

import GlobalAppState, {
  DehydratedState,
  GlobalAppStateProxy,
} from "./GlobalAppState"
import {
  GlobalAppStatePropertyParameters,
  PropertyValueType,
  ContextValueType,
  GlobalAppStatePropertySetter,
} from "./GlobalAppStateProperty"
import {GlobalAppStateContextProvider} from "./GlobalAppStateContext"

import cookieConsent from "../cookieConsent"
import {
  CookieConsent,
  Cookies,
  setCookies,
  purgeCookiesButCheck,
} from "../util/cookies"
import webStorage from "../util/web-storage"

/**
 * An object literal. All fields are optional.
 */
interface AppFactoryOptions {
  /**
   * You can pass a Next.js `Head` component here
   * that will be included in every page.
   */
  Head?: ReactNode;
  /**
   * Any component that wraps its children. Here
   * you can inject UI that persists across all
   * the site's pages.
   */
  Wrapper?: (props: {children: ReactNode}) => JSX.Element;
  /**
   * An array of objects describing the global app state properties
   * that `appFactory` will implement into the `App` component.
   * Read the documentation for `GlobalAppStatePropertyParameters`
   * for more on what the objects should look like.
   */
  properties?: GlobalAppStatePropertyParameters[];
}

interface App {
  (props: AppInitialPropsExtended & AppProps): JSX.Element;
  getInitialProps(appContext: AppContext): Promise<AppInitialPropsExtended>;
  getInitialState(req: IncomingMessage): Promise<DehydratedState>;
  getURLParams(query: ParsedUrlQuery): Promise<URLParams>;
}

interface AppInitialPropsExtended extends AppInitialProps {
  dehydratedState: DehydratedState;
  urlParams: URLParams;
}

export interface URLParams {
  [key: string]: string;
}

/**
 * Function that returns a Next.js custom `App` component.
 * Takes an optional argument where you can specify
 * options to customize the output of the factory.
 * @param options An optional argument where you can specify options to customize the output of the factory
 * @return A Next.js custom `App` component
 */
function appFactory(options?: AppFactoryOptions): App {
  const {
    Head,
    Wrapper = ({children}: {children: ReactNode}): JSX.Element => (
      <>{children}</>
    ),
    properties = [],
  } = options || {}
  const globalAppState = new GlobalAppState([...properties, cookieConsent])
  const keysForSensitiveProperties = globalAppState.getKeysForSensitiveProperties()
  const keysForURLParamListeningProperties = globalAppState.getKeysForURLParamListeningProperties()
  const [
    contextKeys,
    contextProviders,
  ] = globalAppState.getContextKeysAndProviders()
  const ContextProviders = function ContextProviders({
    globalAppState,
    contextValues,
    children,
  }: {
    globalAppState: GlobalAppStateProxy;
    contextValues: ContextValueType[];
    children: ReactNode;
  }): JSX.Element {
    return contextProviders.reduce(
        (accumulator, ContextProvider, index) => (
          <ContextProvider value={contextValues[index]}>
            {accumulator}
          </ContextProvider>
        ),
        <GlobalAppStateContextProvider globalAppState={globalAppState}>
          <Wrapper>{children}</Wrapper>
        </GlobalAppStateContextProvider>,
    )
  }

  const App: App = function App({Component, ...props}) {
    const [state, setState] = useState(() =>
      globalAppState.initializeStateClientSidePhase1(props.dehydratedState),
    )

    const mergeState = useCallback(
        (deltaState) => {
          if (deltaState) {
            setState((prevState) => ({
              ...prevState,
              ...deltaState,
              globalAppState: {
                ...prevState.globalAppState,
                ...deltaState.globalAppState,
              },
            }))
          }
        },
        [setState],
    )

    useEffect(() => {
      globalAppState.initializeStateClientSidePhase2(state).then(mergeState)
    }, [])

    const urlParams = keysForURLParamListeningProperties.map(
        (key) => props.urlParams[key],
    )
    useEffect(() => {
      if (state._mounted) {
        const justReady = urlParams.every((key) => typeof key === "undefined")
        globalAppState
            .onURLParamCallback(state, props.urlParams, justReady)
            .then(mergeState)
      }
    }, [...urlParams, state._mounted])

    const setterDependencies = globalAppState.propertyKeysPlural.map(
        (key) => state.globalAppState[key],
    )
    const setters = useMemo(() => {
      if (state._mounted) {
        const setters: GlobalAppStateProxy = {}
        const rawSetterEntries = Object.entries(globalAppState.getSetters())
        const [
          cookieConsentSetterKey,
          rawCookieConsentSetter,
        ] = rawSetterEntries.pop() as [
          string,
          GlobalAppStatePropertySetter<CookieConsent>
        ]
        setters[cookieConsentSetterKey] = (value: CookieConsent): void => {
          rawCookieConsentSetter(
              setterDependencies[
                  globalAppState.setterNames.indexOf(cookieConsentSetterKey)
              ],
              state.globalAppState.cookieConsent,
              value,
          ).then(() => {
            const cookies: Cookies = {}
            keysForSensitiveProperties.forEach((key) => {
              cookies[key] = state.globalAppState[key].toString()
            })
            if (value) {
              keysForSensitiveProperties.forEach((key) => {
                if (window.sessionStorage[key]) {
                  webStorage.set(key, window.sessionStorage[key])
                }
              })
              setCookies(cookies)
            } else {
              keysForSensitiveProperties.forEach((key) => {
                if (window.localStorage[key]) {
                  webStorage.remove(key)
                }
              })
              purgeCookiesButCheck(cookies)
            }
            setState((prevState) => ({
              ...prevState,
              globalAppState: {
                ...prevState.globalAppState,
                [globalAppState.propertyKeys[
                    globalAppState.setterNames.indexOf(cookieConsentSetterKey)
                ]]: value,
              },
            }))
          })
        }
        rawSetterEntries.forEach(([key, setter]) => {
          setters[key] = (value: PropertyValueType): void => {
            setter(
                setterDependencies[globalAppState.setterNames.indexOf(key)],
                state.globalAppState.cookieConsent,
                value,
            )
                .then((contextValue: ContextValueType | undefined) => {
                  setState((prevState) => ({
                    ...prevState,
                    [globalAppState.propertyKeys[
                        globalAppState.setterNames.indexOf(key)
                    ]]: contextValue,
                    globalAppState: {
                      ...prevState.globalAppState,
                      [globalAppState.propertyKeys[
                          globalAppState.setterNames.indexOf(key)
                      ]]: value,
                    },
                  }))
                })
                .catch((error) => {
                  console.error(error.stack)
                })
          }
        })
        return setters
      } else {
        return {}
      }
    }, [
      ...setterDependencies,
      state.globalAppState.cookieConsent,
      state._mounted,
    ])

    return (
      <>
        {Head}
        <ContextProviders
          globalAppState={{
            ...state.globalAppState,
            ...setters,
            mounted: state._mounted,
            ready: state._ready,
          }}
          contextValues={contextKeys.map((key) => state[key])}
        >
          <Component {...props.pageProps} />
        </ContextProviders>
      </>
    )
  }

  App.getInitialProps = async ({
    Component,
    ctx,
  }): Promise<AppInitialPropsExtended> => {
    let pageProps = {}
    if (Component.getInitialProps) {
      pageProps = {...pageProps, ...(await Component.getInitialProps(ctx))}
    }
    let dehydratedState = {}
    if (ctx.req) {
      dehydratedState = await App.getInitialState(ctx.req)
    }
    const urlParams = await App.getURLParams(ctx.query)
    return {pageProps, dehydratedState, urlParams}
  }

  App.getInitialState = async (req): Promise<DehydratedState> => {
    return await globalAppState.initializeStateServerSide(req)
  }

  App.getURLParams = async (query): Promise<URLParams> => {
    const urlParams: URLParams = {}
    globalAppState.propertyKeys.forEach((key) => {
      urlParams[key] = Array.isArray(query[key]) ?
        query[key][query[key].length - 1] :
        (query[key] as string)
    })
    return urlParams
  }

  return App
}

export default appFactory
