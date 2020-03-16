[`lang`] in [`nextjs-global-app-state@2.0.0`][`nextjs-global-app-state`]

```js
import lang from "nextjs-global-app-state/lang";
// or
import { lang } from "nextjs-global-app-state";
```

```ts
function lang(options: LangOptions): GlobalAppStatePropertyParameters;
```

A ready-made global app state property which constitutes a minimal yet powerful internationalization solution. It also serves as an example of what can be accomplished with the interface exposed by [`nextjs-global-app-state`] for creating global app state properties, since it utilizes the same interface to achieve all of its functionality. To use [`lang`], call it with a [`LangOptions`] object. [`lang`] returns a [`GlobalAppStatePropertyParameters`] object which you can then pass to the [`appFactory`] function as an element in the [`properties`] array.

#### Features

- Automatic language detection
  - Based on cookies and HTTP headers server-side
  - Based on cookies and web storage client-side
- Way to allow the client to express explicit preference that persists across sessions
- Solution for separating UI-visible text from the source code
  - Inspired by the concept of string resources when developing Android applications
  - Flexible — as long as the function signature is correct, [`getStrings`] can retrieve the string resources however you want
  - Powered by [React's Context API] and [React Hooks] — use [`useStrings`] to use the string resources in your pages and components

### `LangOptions`

```ts
interface LangOptions {
  defaultLang: string;
  defaultSupportedLanguages: string[];
  getStrings: (lang: string) => Strings | Promise<Strings>;
  getSupportedLanguages?: {
    serverSide?(): string[] | Promise<string[]>;
    clientSide?(): string[] | Promise<string[]>;
  };
}
```

All fields are required, except [`getSupportedLanguages`] and its fields.

#### `defaultLang`

A default language (specified as a lang code) to fall back to if both restoring language preference and auto-detecting language was unsuccessful. [`defaultLang`] must exist in [`defaultSupportedLanguages`].

Alias for [`GlobalAppStatePropertyParameters.defaultValue`].

#### Remarks

The string resources for your default language is expected to be the most complete string resource set. [`lang`] has a built-in feature where if translations (string resource sets for other languages than the default language) are incomplete or differ in structure, [`lang`] fills out any missing parts with corresponding parts from the string resource set for your default language and removes any other kinds of differences in structure. This is good for a number of reasons.

1. It allows for having partial translations without any additional implementations
2. It also acts as a fail-safe — blocking potentially flawed string resource sets from breaking the code. In the code, you can always rely on the string resources to have the structure of the string resources for your default language.

#### `defaultSupportedLanguages`

An array of lang codes representing the languages that your site/application supports.

Alias for [`GlobalAppStatePropertyParameters.defaultValues`].

#### `getStrings`

```ts
function getStrings(lang: string): Strings | Promise<Strings>;
```

A function that retrieves string resources. The function can either be synchronous or asynchronous, it's up to you.

#### `getSupportedLanguages`

An object literal containing functions that retrieve arrays of lang codes representing the languages that you site/application supports. The arrays returned by these functions override [`defaultSupportedLanguages`].

Alias for [`GlobalAppStatePropertyParameters.getValues`], so the shape of [`getSupportedLanguages`] must comply with the shape of [`GlobalAppStatePropertyParameters.getValues`].

---

## Miscellaneous Functions

### `useStrings`

```ts
function useStrings(): Strings;
```

A [React Hooks] -style function which returns string resources.

---

## Miscellaneous Types

### `Strings`

```ts
type Strings = { [key: string]: string & string[] & Strings & Strings[] };
```

Describes the shape of string resources.

[`lang`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/lang.md
[`langoptions`]: #LangOptions
[`defaultlang`]: #defaultLang
[`defaultsupportedlanguages`]: #defaultSupportedLanguages
[`getstrings`]: #getStrings
[`getsupportedlanguages`]: #getSupportedLanguages
[`usestrings`]: #useStrings
[`strings`]: #strings
[`globalappstatepropertyparameters`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/GlobalAppStatePropertyParameters.md
[`globalappstatepropertyparameters.defaultvalue`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/GlobalAppStatePropertyParameters.md#defaultValue
[`globalappstatepropertyparameters.defaultvalues`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/GlobalAppStatePropertyParameters.md#defaultValues
[`globalappstatepropertyparameters.controlcontext.transformvalue`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/GlobalAppStatePropertyParameters.md#controlContextTransformValue
[`globalappstatepropertyparameters.getvalues`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/GlobalAppStatePropertyParameters.md#getValues
[`appfactory`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/appFactory.md
[`properties`]: https://github.com/DanielGiljam/nextjs-global-app-state/blob/master/legacy-docs/v2.0.0/appFactory.md#properties
[`nextjs-global-app-state`]: https://www.npmjs.com/package/nextjs-global-app-state/v/2.0.0
[react's context api]: https://reactjs.org/docs/context.html
[react hooks]: https://reactjs.org/docs/hooks-intro.html
