# Next.js Global App State

A custom `App` component which implements a robust, full stack solution for maintaining the kind of state that span the entire website. _([Read more about custom App component's in Next.js here!](https://nextjs.org/docs/advanced-features/custom-app "nextjs.org/docs/advanced-features/custom-app"))_

Examples of state that needs to span the entire website:

- Language
- Theme
- Cookie and data collection consent
- Log-in status and user ID

## Library contents

- Factory for creating your customized version of this `App` component with the state solution built in
- Building blocks for basic states in websites, such as language, theme (more may be added in the future)
- API for creating your own states

The library is written in TypeScript and has custom types, so you can enjoy the benefits of code completion and IntelliSense when using the library.

The library supports tree shaking. Import only the parts you need and minimize the bundle size of whatever you're working on.

## Basic Usage

Add `nextjs-global-app-state` as a dependency to your Next.js project.

```
# Installs the package adds it as a dependency in package.json
npm i -s nextjs-global-app-state

# Installs the package and adds it as a devDependency in package.json
npm i -D nextjs-global-app-state
```

In your _"pages"_ directory, create a file called _\_app.js_. Add the following code to the file.

```js
import appFactory from "nextjs-global-app-state";

export default appFactory();
```

Now every page in your Next.js project can access the language and theme state and the state persists when navigating and across sessions.

This is how you access global app state in a page in your project.

```js
import useGlobalAppState from "nextjs-global-app-state/useGlobalAppState";

function ExamplePage() {
  const globalAppState = useGlobalAppState();

  console.log(globalAppState.languages); // ["english", "svenska", "suomi"]
  console.log(globalAppState.themes); // ["auto", "light", "dark"]

  return (
    <main>
      <p>Languages: {globalAppState.languages.join(", ")}</p>
      <p>Themes: {globalAppState.themes.join(", ")}</p>
    </main>
  );
}

export default ExamplePage;
```

## API Reference & Documentation

_[Go to the wiki pages](https://github.com/DanielGiljam/nextjs-global-app-state/wiki "github.com/DanielGiljam/nextjs-global-app-state/wiki")_
