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

interface AppFactoryOptions {
  Head?: ReactNode;
  Wrapper?: (props: {children: ReactNode}) => JSX.Element;
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

function appFactory({
  Head,
  Wrapper = ({children}: {children: ReactNode}): JSX.Element => <>{children}</>,
  properties = [],
}: AppFactoryOptions = {}): App {
  const globalAppState = new GlobalAppState([...properties, cookieConsent])
  const [
    propertyKeys,
    propertyKeysPlural,
    setterNames,
  ] = globalAppState.getPropertyKeys()
  const [
    contextKeys,
    contextProviders,
  ] = globalAppState.getContextKeysAndProviders()
  console.group()
  console.log("globalAppState outside of App:", globalAppState)
  console.log("propertyKeys outside of App:", propertyKeys)
  console.log("propertyKeysPlural outside of App:", propertyKeysPlural)
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

    const setterDependencies = propertyKeysPlural.map(
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
      let index: number
      let propertyKey: string
      Object.entries(globalAppState.getSetters()).forEach(([key, setter]) => {
        index = setterNames.indexOf(key)
        propertyKey = propertyKeys[index]
        console.log(`Generating ${key}(). Fixed arguments/parameters:`, {
          // @ts-ignore
          values: setterDependencies[index],
          cookieConsent: state.globalAppState.cookieConsent,
        })
        setters[key] = (value: PropertyValueType): void => {
          setter(
              // TODO: figure out this type issue (when constructing setters)!
              // @ts-ignore
              setterDependencies[index],
              state.globalAppState.cookieConsent,
              value,
          ).then((contextValue: ContextValueType | undefined) => {
            setState((prevState) => ({
              ...prevState,
              [propertyKey]: contextValue,
              globalAppState: {
                ...prevState.globalAppState,
                [propertyKey]: value,
              },
            }))
          })
        }
      })
      console.info("Generating setter functions: finished.")
      console.groupEnd()
      return setters
    }, [...setterDependencies, state.globalAppState.cookieConsent])

    useCallback(() => {
      console.group()
      console.info("cookieConsent callback: started...")
      console.log("entirety of state as received by cookieConsent callback:", {
        ...state,
        globalAppState: {...state.globalAppState, ...setters},
      })
      if (state.globalAppState.cookieConsent) {
        const cookies: Cookies = {}
        propertyKeys.forEach((key) => {
          cookies[key] = state.globalAppState[key]
        })
        setCookies(cookies)
      } else {
        setCookies({})
      }
      console.info("cookieConsent callback: finished.")
      console.groupEnd()
    }, [state.globalAppState.cookieConsent])

    console.group()
    console.log("globalAppState before render:", globalAppState)
    console.log("propertyKeys before render:", propertyKeys)
    console.log("propertyKeysPlural before render:", propertyKeysPlural)
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

  App.getInitialProps = async ({
    Component,
    ctx,
  }): Promise<AppInitialPropsExtended> => {
    let pageProps = {}
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
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
