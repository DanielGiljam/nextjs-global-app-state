[`appFactory`] in [`nextjs-global-app-state@2.0.0`]

```js
import appFactory from "nextjs-global-app-state/appFactory";
// or
import appFactory from "nextjs-global-app-state";
// or
import { appFactory } from "nextjs-global-app-state";
```

```ts
function appFactory(options?: AppFactoryOptions): App;
```

Function that returns a [Next.js custom App component][`app`]. Takes an optional argument where you can specify options to customize the output of the factory.

### `AppFactoryOptions`

```ts
interface AppFactoryOptions {
  Head?: ReactNode;
  Wrapper?: (props: { children: ReactNode }) => JSX.Element;
  properties?: GlobalAppStatePropertyParameters[];
}
```

All fields are optional.

#### `Head`

You can pass a [`Head`] component here that will be included in every page.

#### `Wrapper`

Any component that wraps its children. Here you can inject UI that persists across all the site's pages.

#### Example

```jsx
import appFactory from "nextjs-global-app-state/appFactory";

import { Fragment } from "react";
import Navbar from "./navbar";

function Wrapper({ children }) {
  return (
    <Fragment>
      <Navbar />
      {children}
    </Fragment>
  );
}

export default appFactory({ Wrapper });
```

#### `properties`

An array of objects describing the global app state properties that [`appFactory`] will implement into the [`App`] component. Read the documentation for [`GlobalAppStatePropertyParameters`] for more what the objects should look like.

[`appfactory`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/appFactory.md
[`globalappstatepropertyparameters`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/GlobalAppStatePropertyParameters.md
[`nextjs-global-app-state@2.0.0`]: https://www.npmjs.com/package/nextjs-global-app-state/v/2.0.0
[`app`]: https://nextjs.org/docs/advanced-features/custom-app
[`head`]: https://nextjs.org/docs/api-reference/next/head
[`getinitialprops`]: https://nextjs.org/docs/api-reference/data-fetching/getInitialProps
