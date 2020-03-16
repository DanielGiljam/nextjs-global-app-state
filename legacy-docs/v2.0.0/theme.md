[`theme`] in [`nextjs-global-app-state@2.0.0`][`nextjs-global-app-state`]

```js
import theme from "nextjs-global-app-state/theme";
// or
import { theme } from "nextjs-global-app-state";
```

```ts
function theme(options: ThemeOptions): GlobalAppStatePropertyParameters;
```

A ready-made global app state property which auto-detects system theme or persists explicit preference across sessions. It also serves as an example of how well the interface exposed by [`nextjs-global-app-state`] integrates with other popular libraries. In this case, [`theme`] integrates with [Material-UI] which uses [React's Context API] to distribute theme related parameters throughout the component tree. To use [`theme`], call it with a [`ThemeOptions`] object. [`theme`] returns a [`GlobalAppStatePropertyParameters`] object which you can then pass to the [`appFactory`] function as an element in the [`properties`] array.

#### Features

- Automatic theme detection
- Way to allow the client to express explicit preference that persists across sessions
- Designed to integrate with [Material-UI]

### `ThemeOptions`

```ts
interface ThemeOptions {
  createTheme: (themeType: "light" | "dark") => Theme;
  ThemeProvider: Provider<Theme>;
}
```

All fields are required.

#### `createTheme`

```ts
function createTheme(themeType: "light" | "dark"): Theme;
```

Get forwarded to [`GlobalAppStatePropertyParameters.controlContext.transformValue`].

#### Example

An example of to define [`createTheme`] for [Material-UI] integration:

```js
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";

function createTheme(themeType) {
  return createMuiTheme({ palette: { type: themeType } });
}
```

Another example can be found in the [`README.md`].

#### `ThemeProvider`

Gets forwarded to [`GlobalAppStatePropertyParameters.controlContext.ContextProvider`].

#### Example

An example of to define [`ThemeProvider`] for [Material-UI] integration:

```jsx
import { ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";

function ThemeProvider({ value, children }) {
  return <MuiThemeProvider theme={value}>{children}</MuiThemeProvider>;
}
```

Another example can be found in the [`README.md`].

---

## Miscellaneous Types

### `Theme`

[A Material-UI theme].

[`theme`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/theme.md
[`themeoptions`]: #ThemeOptions
[`createtheme`]: #createTheme
[`themeprovider`]: #ThemeProvider
[`globalappstatepropertyparameters`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/GlobalAppStatePropertyParameters.md
[`globalappstatepropertyparameters.controlcontext.transformvalue`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/GlobalAppStatePropertyParameters.md#controlContextTransformValue
[`globalappstatepropertyparameters.controlcontext.contextprovider`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/GlobalAppStatePropertyParameters.md#controlContextContextProvider
[`appfactory`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/appFactory.md
[`properties`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/appFactory.md#properties
[`readme.md`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/v2.0.0/REAMDE.md#Getting-Started
[`nextjs-global-app-state`]: https://www.npmjs.com/package/nextjs-global-app-state/v/2.0.0
[react's context api]: https://reactjs.org/docs/context.html
[material-ui]: https://material-ui.com/
[react hooks]: https://reactjs.org/docs/hooks-intro.html
[a material-ui theme]: https://material-ui.com/customization/theming/
