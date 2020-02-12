require("dotenv").config()

if (!process.env.ASSET_PREFIX) {
  throw new TypeError("process.env.ASSET_PREFIX is not defined!")
}

module.exports = {
  env: {
    // When loading static resources over the network in the Next.js app's/website's code,
    // this combined with the path to the resource becomes the URL of the requested resource.
    ASSET_PREFIX: process.env.ASSET_PREFIX,
  },
  // Tells Next.js what kind of build it should produce.
  // Read about the differences at https://nextjs.org/docs/api-reference/next.config.js/build-target [2020-01-08]
  target: "serverless",
  webpack(config) {
    config.resolve.modules = [
      ...config.resolve.modules,
      // Tells Webpack to look for modules imported with a module path here.
      // The path is relative to where package.json and the "node_modules"-folder resides.
      "src",
    ]
    return config
  },
}
