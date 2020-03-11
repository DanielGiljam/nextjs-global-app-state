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
} from "./GlobalAppStateProperty"
import {GlobalAppStateContextProvider} from "./GlobalAppStateContext"

import cookieConsent from "../cookieConsent"
import {setCookies, Cookies} from "../util/cookies"

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
   * A `getInitialProps` function for the `App` component.
   */
  getInitialProps?: (appContext: AppContext) => Promise<AppInitialProps>;
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

interface URLParams {
  lang?: string;
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
    getInitialProps,
    properties = [],
  } = options || {}
  const globalAppState = new GlobalAppState([...properties, cookieConsent])
  const [
    contextKeys,
    contextProviders,
  ] = globalAppState.getContextKeysAndProviders()

  const App: App = function App({Component, ...props}) {
    const [state, setState] = useState(() =>
      globalAppState.initializeStateClientSidePhase1(props.dehydratedState),
    )

    useEffect(() => {
      globalAppState
          .initializeStateClientSidePhase2(state)
          .then((deltaState) => {
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
          })
    }, [])

    useEffect(() => {
      if (state.globalAppState.cookieConsent) {
        const cookies: Cookies = {}
        globalAppState.propertyKeys.forEach((key) => {
          cookies[key] = state.globalAppState[key]
        })
        setCookies(cookies)
      } else {
        setCookies({})
      }
    }, [state.globalAppState.cookieConsent])

    const contexts = contextKeys.map((key) => state[key])
    const ContextProviders = useCallback(
        ({children}: {children: ReactNode}): JSX.Element =>
          contextProviders.reduce(
              (accumulator, ContextProvider, index) => (
                <ContextProvider value={contexts[index]}>
                  {accumulator}
                </ContextProvider>
              ),
              <>{children}</>,
          ),
        contexts,
    )

    const setterDependencies = globalAppState.propertyKeysPlural.map(
        (key) => state.globalAppState[key],
    )
    const setters = useMemo(() => {
      const setters: GlobalAppStateProxy = {}
      Object.entries(globalAppState.getSetters()).forEach(([key, setter]) => {
        setters[key] = (value: PropertyValueType): void => {
          setter(
              setterDependencies[globalAppState.setterNames.indexOf(key)],
              state.globalAppState.cookieConsent,
              value,
          ).then((contextValue: ContextValueType | undefined) => {
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
        }
      })
      return setters
    }, [...setterDependencies, state.globalAppState.cookieConsent])

    return (
      <>
        {Head}
        <ContextProviders>
          <GlobalAppStateContextProvider
            globalAppState={{...state.globalAppState, ...setters}}
          >
            <Wrapper>
              <Component {...props.pageProps} />
            </Wrapper>
          </GlobalAppStateContextProvider>
        </ContextProviders>
      </>
    )
  }

  App.getInitialProps = async (
    appContext,
  ): Promise<AppInitialPropsExtended> => {
    let pageProps = {}
    if (getInitialProps) {
      pageProps = await (await getInitialProps(appContext)).pageProps
    }
    const {Component, ctx} = appContext
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
    return {
      lang: Array.isArray(query._lang) ? query._lang[0] : query._lang,
    }
  }

  return App
}

export default appFactory
