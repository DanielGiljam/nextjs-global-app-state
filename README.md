# Next.js Global App State

You're creating a website or web application powered by [Next.js](https://nextjs.org/). You're ambitious — you want your website/web application to have all those fancy features that the triple-A sites and apps have, to be able to compete with them. We're talking about features such as

- light and dark UI themes
  - automatic theme selection
    - based on system theme client-side
    - based on before/after sunrise/sunset server-side (or if system theme can't be determined client-side)
  - feature which allows user to override auto selection and remember user preference in future sessions
- automatic locale (language) detection
  - locale-agnostic URLs where paths can be prefixed with a lang code, but don't have to!
- GDPR and CCPA compliance with minimal UX impact
  - cookie consent prompt/banner shows up only when it needs to
  - banner doesn't show up for crawlers or in "thumbnail previews" of your site

As you can see, the list quickly gets quite involved. Right off the bat you're facing multiple interdependent stateful systems along with their fallback systems that you have to implement. This can feel quite cumbersome, especially when most of these features may "lie beside the point" of your website/application.

The purpose of this library is to better get you past that mountain of features and onto developing the unique features and functionality of your website/application. If you're interested, keep reading!

> Features such as the ones listed above, we call them **_global app state properties_**. Don't ask why.

Similarly, we refer to all those features combined (the part of the application that's responsible for language, theme, etc.) as the **_global app state_**. That's where the name of the library comes from. "Global" since language and theme — if we keep using them as example — needs to be known all over the application, and "state" because they are stateful properties. We know, the name is really generic and unspecific, almost to the degree of misleading, but for now you just have to deal with it. Might be subject to change later.

Having said that, this library is not a replacement for state management solutions such as [Redux](https://redux.js.org/) or [xstate](https://xstate.js.org/). Well, what is this library then and what exactly does it do? Ok, here's a library features -section.

## Library Features

- An interface that let's you design global app state properties
- Some ready made global app state properties

## Pre-Requisites

A Next.js project.

## Getting Started

Add [`nextjs-global-app-state`](https://www.npmjs.com/package/nextjs-global-app-state) as a dependency to your Next.js project.

```bash
# Installs the package adds it as a dependency in package.json
npm i -s nextjs-global-app-state

# Installs the package and adds it as a devDependency in package.json
npm i -D nextjs-global-app-state
```

In your `pages` directory, create a file called `_app.js`. Add the following code to the file.

```jsx
import { appFactory, lang, theme } from "nextjs-global-app-state";

// The global app state property `theme` is designed to integrate well with Material-UI
import responsiveFontSizes from "@material-ui/core/styles/responsiveFontSizes";
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";
import ThemeProvider from "@material-ui/core/styles/ThemeProvider";
import CssBaseline from "@material-ui/core/CssBaseline";

import fetch from "isomorphic-fetch";

// `lang` expects that provide a function for fetching string resources.
async function getStrings(lang) {
  return await fetch(
    `${process.env.ASSET_PREFIX}/string-resources/${lang}.json`
  )
    .then(res => res.json())
    .catch(() => {
      console.error(`Failed to fetch string resources for "${lang}".`);
      return {};
    });
}

export default appFactory({
  properties: [
    lang({
      defaultLang: "en",
      defaultSupportedLanguages: ["en", "sv", "fi"],
      getStrings
    }),
    theme({
      createTheme: themeType =>
        responsiveFontSizes(createMuiTheme({ palette: { type: themeType } })),
      ThemeProvider: ({ value, children }) => (
        <ThemeProvider theme={value}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      )
    })
  ]
});
```

Every page/component in your Next.js project can now access the global app state. Here's a page that renders the state of `lang` and `theme` as text.

```jsx
import useGlobalAppState from "nextjs-global-app-state/useGlobalAppState";

function ExamplePage() {
  const globalAppState = useGlobalAppState();

  return (
    <main>
      <p>Language: {globalAppState.lang}</p>
      <p>Theme: {globalAppState.theme}</p>
    </main>
  );
}

export default ExamplePage;
```

## Full Documentation

_[Go to the wiki pages](https://github.com/DanielGiljam/nextjs-global-app-state/wiki)_
