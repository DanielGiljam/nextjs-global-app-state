[`withGlobalAppState`] in [`nextjs-global-app-state@2.0.0`][`nextjs-global-app-state`]

```js
const withGlobalAppState = require("nextjs-global-app-state/withGlobalAppState");
```

```ts
function withGlobalAppState(nextConfig?: NextConfig): NextConfig;
```

A [`next.config.js`] wrapper function. You must wrap your [`next.config.js`] using this function in order for [`nextjs-global-app-state`] to work. The function does very non-destructive and slight customizations to the [webpack] configuration so that [`nextjs-global-app-state`] is included in the batch of modules that get transpiled. Check out the [`README.md`] for an example of how to use [`withGlobalAppState`].

[`withglobalappstate`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/withGlobalAppState.md
[`nextjs-global-app-state`]: https://www.npmjs.com/package/nextjs-global-app-state/v/2.0.0
[`next.config.js`]: https://nextjs.org/docs/api-reference/next.config.js/introduction
[webpack]: https://webpack.js.org/
[`readme.md`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/v2.0.0/REAMDE.md#Getting-Started
