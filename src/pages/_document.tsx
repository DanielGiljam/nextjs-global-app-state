import React, {Fragment} from "react"

import __document, {
  DocumentContext,
  DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document"

import ServerStyleSheets from "@material-ui/styles/ServerStyleSheets"

/*
 * Material-UI integration achieved thanks to this example: https://github.com/mui-org/material-ui/tree/master/examples/nextjs 2019-09-13
 */

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _document extends __document {
  static async getInitialProps(
      ctx: DocumentContext,
  ): Promise<DocumentInitialProps> {
    /* Resolution order
     *
     * On the server:
     * 1. app.getInitialProps
     * 2. page.getInitialProps
     * 3. document.getInitialProps
     * 4. app.render
     * 5. page.render
     * 6. document.render
     *
     * On the server with error:
     * 1. document.getInitialProps
     * 2. app.render
     * 3. page.render
     * 4. document.render
     *
     * On the client
     * 1. app.getInitialProps
     * 2. page.getInitialProps
     * 3. app.render
     * 4. page.render
     */

    // Render app and page and get the context of the page with collected side effects.
    const sheets = new ServerStyleSheets()
    const originalRenderPage = ctx.renderPage

    ctx.renderPage = (): ReturnType<DocumentContext["renderPage"]> =>
      originalRenderPage({
        enhanceApp: (App) => (
            props,
        ): ReturnType<ServerStyleSheets["collect"]> =>
          sheets.collect(<App {...props} />),
      })

    const initialProps = await __document.getInitialProps(ctx)

    return {
      ...initialProps,
      // Styles fragment is rendered after the app and page rendering finish.
      styles: [
        <Fragment key={"styles"}>
          {initialProps.styles}
          {sheets.getStyleElement()}
        </Fragment>,
      ],
    }
  }

  render(): JSX.Element {
    return (
      <Html lang={this.props.__NEXT_DATA__.props.dehydratedState.lang.value}>
        <Head>
          <link
            rel={"stylesheet"}
            href={
              "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
            }
          />
          <link
            rel={"stylesheet"}
            href={"https://fonts.googleapis.com/icon?family=Material+Icons"}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default _document
