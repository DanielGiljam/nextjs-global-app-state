# `appFactory`

```ts
function appFactory(options?: AppFactoryOptions): App;
```

Function that returns a [Next.js custom App component](https://nextjs.org/docs/advanced-features/custom-app). Takes an optional argument where you can specify options to customize the output of the factory.

## `AppFactoryOptions`

```ts
interface AppFactoryOptions {
  stringResourcesPath?: string;
  Wrapper?: typeof React.ReactNode;
}
```

All fields are optional.

### `stringResourcesPath`

A string which represents a URL pointing to a path where string resources can be fetched from. For example _http://localhost:3000/string-resources/_ or _https://example.domain/path-to-strings/_. The `stringResourcesPath` is used internally like this to fetch string resources:

```js
// languageCode can be "en", "zh", "es", etc.
fetch(`${stringResourcesPath}${languageCode}.json`)
    .then(...
```

### `Wrapper`

A component that wraps the `Component` props that the `App` receives. This is a way to surround pages with UI elements that should persist across pages, e.g. a navbar or a footer. Just remember the `children` prop, because otherwise the `Wrapper` will block pages from being rendered.

Example:

```js
import appFactory from "nextjs-global-app-state";

import Navbar from "./navbar";

function Wrapper({ children }) {
  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}

export default appFactory({ Wrapper });
```
