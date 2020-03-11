/* eslint-disable react/prop-types */

import {IncomingMessage} from "http"
import {ParsedUrlQuery} from "querystring"

import React, {ReactNode, useEffect, useMemo, useState} from "react"

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
  console.group()
  console.log("globalAppState outside of App:", globalAppState)
  console.log(
      "contextKeys and contextProviders outside of App:",
      Object.fromEntries(
          contextKeys.map((value, index) => [value, contextProviders[index]]),
      ),
  )
  console.groupEnd()

  const App: App = function App({Component, ...props}) {
    const [state, setState] = useState(() => {
      console.group()
      console.info("initializeStateClientSidePhase1: started...")
      console.log(
          "dehydratedState as sent to initializeStateClientSidePhase1:",
          props.dehydratedState,
      )
      const hydratedState = globalAppState.initializeStateClientSidePhase1(
          props.dehydratedState,
      )
      console.log(
          "hydratedState as returned by initializeStateClientSidePhase1:",
          hydratedState,
      )
      console.info("initializeStateClientSidePhase1: finished.")
      console.groupEnd()
      return hydratedState
    })

    useEffect(() => {
      console.info("initializeStateClientSidePhase2: started...")
      console.log(
          "hydratedState as sent to initializeStateClientSidePhase2:",
          state,
      )
      globalAppState
          .initializeStateClientSidePhase2(state)
          .then((deltaState) => {
            console.log(
                "deltaState as returned by initializeStateClientSidePhase2:",
                deltaState,
            )
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
            console.info("initializeStateClientSidePhase2: finished.")
          })
    }, [])

    useEffect(() => {
      console.group()
      console.info("cookieConsent callback: started...")
      if (state.globalAppState.cookieConsent) {
        const cookies: Cookies = {}
        globalAppState.propertyKeys.forEach((key) => {
          cookies[key] = state.globalAppState[key]
        })
        setCookies(cookies)
      } else {
        setCookies({})
      }
      console.info("cookieConsent callback: finished.")
      console.groupEnd()
    }, [state.globalAppState.cookieConsent])

    const contexts = contextKeys.map((key) => state[key])
    const ContextProviders = useMemo(() => {
      console.group()
      console.info("Generating ContextProviders component: started...")
      console.log(
          "\"contexts\" as received by ContextProviders -generator:",
          contexts,
      )
      const ContextProviders = ({
        children,
      }: {
        children: ReactNode;
      }): JSX.Element =>
        contextProviders.reduce(
            (accumulator, ContextProvider, index) => (
              <ContextProvider value={contexts[index]}>
                {accumulator}
              </ContextProvider>
            ),
            <>{children}</>,
        )
      console.info("Generating ContextProviders component: finished.")
      console.groupEnd()
      return ContextProviders
    }, contexts)

    const setterDependencies = globalAppState.propertyKeysPlural.map(
        (key) => state.globalAppState[key],
    )
    const setters = useMemo(() => {
      console.group()
      console.info("Generating setter functions: started...")
      console.log(
          "setterDependencies as received by setter functions -generator:",
          setterDependencies,
      )
      console.log(
          "cookieConsent as received by setter functions -generator:",
          state.globalAppState.cookieConsent,
      )
      const setters: GlobalAppStateProxy = {}
      Object.entries(globalAppState.getSetters()).forEach(([key, setter]) => {
        console.log(`Generating ${key}(). Fixed arguments/parameters:`, {
          values: setterDependencies[globalAppState.setterNames.indexOf(key)],
          cookieConsent: state.globalAppState.cookieConsent,
        })
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
      console.info("Generating setter functions: finished.")
      console.groupEnd()
      return setters
    }, [...setterDependencies, state.globalAppState.cookieConsent])

    console.group()
    console.log("globalAppState before render:", globalAppState)
    console.log(
        "contextKeys and contextProviders before render:",
        Object.fromEntries(
            contextKeys.map((value, index) => [value, contextProviders[index]]),
        ),
    )
    console.log("\"contexts\" before render:", contexts)
    console.log("setterDependencies before render:", setterDependencies)
    console.log("entirety of state before render:", {
      ...state,
      globalAppState: {...state.globalAppState, ...setters},
    })
    console.groupEnd()
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
      console.info("initializeStateServerSide: started...")
      dehydratedState = await App.getInitialState(ctx.req)
      console.log(
          "dehydratedState as returned by initializeStateServerSide:",
          dehydratedState,
      )
      console.info("initializeStateServerSide: finished.")
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
