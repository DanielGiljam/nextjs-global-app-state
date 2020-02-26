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

  const App: App = function App({Component, ...props}) {
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

    useCallback(() => {
      if (state.globalAppState.cookieConsent) {
        const cookies: Cookies = {}
        propertyKeys.forEach((key) => {
          cookies[key] = state.globalAppState[key]
        })
        setCookies(cookies)
      } else {
        setCookies({})
      }
    }, [state.globalAppState.cookieConsent])

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
