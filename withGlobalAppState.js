/* eslint-disable @typescript-eslint/explicit-function-return-type */

function withGlobalAppState(nextConfig) {
  const webpack = nextConfig.webpack
  nextConfig.webpack = (config, options) => {
    if (
      options.isServer &&
      (options.dev || nextConfig.target !== "serverless")
    ) {
      const externals = config.externals[0]
      config.externals[0] = (context, request, callback) => {
        return /nextjs-global-app-state/.test(request) ?
          callback() :
          externals(context, request, callback)
      }
    }
    const exclude = config.module.rules[0].exclude
    config.module.rules[0].exclude = (path) =>
      /nextjs-global-app-state/.test(path) ? false : exclude(path)
    config.module.rules[0].include.push(/nextjs-global-app-state/)
    return webpack ? webpack(config, options) : config
  }
  return nextConfig
}

module.exports = withGlobalAppState
