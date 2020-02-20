# Next.js Global App State

A custom `App` component which implements a robust, full stack solution for maintaining state across an entire website experience. _([Read more about custom App component's in Next.js here!](https://nextjs.org/docs/advanced-features/custom-app "nextjs.org/docs/advanced-features/custom-app"))_

Examples of state that span across an entire website experience:

- Language
- Theme
- Cookie and data collection consent
- Log-in status and user ID

## Library contents

- `App` component factory
- Building blocks for basic state, such as language, theme (more may be added in the future)
- API for creating your own states

## Basic Usage

Add [`nextjs-global-app-state`](https://www.npmjs.com/package/nextjs-global-app-state "www.npmjs.com/package/nextjs-global-app-state") as a dependency to your Next.js project.

```bash
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
