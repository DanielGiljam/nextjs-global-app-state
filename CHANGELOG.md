# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2020-03-16

### Added

- [`onURLParam`](https://github.com/DanielGiljam/nextjs-global-app-state/wiki/GlobalAppStatePropertyParameters#onURLParam) flag that you can enable for your global app state property in order to be able to set its state with a [URL query parameter](https://nodejs.org/api/querystring.html#querystring_querystring_parse_str_sep_eq_options).
- `mounted` and `ready` properties on the object returned by `useGlobalAppState` that indicate when the site/app has mounted in the client's browser and when it's fully ready to start receiving user input.
- [`lang`](https://github.com/DanielGiljam/nextjs-global-app-state/wiki/lang) now sets the HTML document's `lang` attribute.

### Fixed

- Issue where changes to global app state would remount components causing them to lose local state.
- Bug where errors thrown by global app state property setters weren't caught.
- Bug where in rare cases [`contextValue`](https://github.com/DanielGiljam/nextjs-global-app-state/wiki/GlobalAppStatePropertyParameters#controlContextContextValue) wouldn't be populated as expected.

## [2.0.0] - 2020-03-14

### Added

- First mature version of [`nextjs-global-app-state`](https://www.npmjs.com/package/nextjs-global-app-state/v/2.0.0).

## [1.0.0] - 2020-02-25

### Added

- Very crude initial version of [`nextjs-global-app-state`](https://www.npmjs.com/package/nextjs-global-app-state/v/1.0.0).

[1.0.0]: https://github.com/DanielGiljam/nextjs-global-app-state/releases/tag/v1.0.0
[2.0.0]: https://github.com/DanielGiljam/nextjs-global-app-state/releases/tag/v2.0.0
[2.1.0]: https://github.com/DanielGiljam/nextjs-global-app-state/releases/tag/v2.1.0
