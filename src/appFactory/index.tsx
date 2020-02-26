/* eslint-disable react/prop-types */

import {IncomingMessage} from "http"
import {ParsedUrlQuery} from "querystring"

import React, {Component, ReactNode, useEffect, useMemo, useState} from "react"

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

interface AppFactoryOptions {
  Head?: ReactNode;
  Wrapper?: typeof Component;
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

function appFactory({Head, Wrapper, properties}: AppFactoryOptions): App {
  const globalAppState = new GlobalAppState(properties)
  const [
    contextKeys,
    contextProviders,
  ] = globalAppState.getContextKeysAndProviders()
  const [
    propertyKeys,
    propertyKeysPlural,
    setterNames,
  ] = globalAppState.getPropertyKeys()

  const App: App = function App(props) {
    const [state, setState] = useState(() => {
      return globalAppState.initializeStateClientSidePhase1(
          props.dehydratedState,
      )
    })

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

    const contexts = contextKeys.map((key) => state[key])
    const ContextProviders = useMemo(
        () => ({children}: {children: ReactNode}): JSX.Element =>
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

    const setterDependencies = propertyKeysPlural.map(
        (key) => state.globalAppState[key],
    )
    const setters = useMemo(() => {
      const setters: GlobalAppStateProxy = {}
      let index: number
      let propertyKey: string
      Object.entries(globalAppState.getSetters()).forEach(([key, setter]) => {
        index = setterNames.indexOf(key)
        propertyKey = propertyKeys[index]
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
      return setters
    }, [...setterDependencies, state.globalAppState.cookieConsent])

    return (
      <>
        {Head}
        <ContextProviders>
          <GlobalAppStateContextProvider
            globalAppState={{...state.globalAppState, ...setters}}
          >
            {Wrapper ? (
              <Wrapper>
                <Component {...props.pageProps} />
              </Wrapper>
            ) : (
              <Component {...props.pageProps} />
            )}
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
