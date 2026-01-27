import { WebpackManifestPlugin } from "webpack-manifest-plugin"
import path from "path"
import { fileURLToPath } from "url"
import TerserPlugin from "terser-webpack-plugin"

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url)
// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(__filename)

export default {
  mode: process.env.ENV || "development",
  context: path.join(__dirname, "src"),
  entry: "./site.js",
  output: {
    library: "SITE",
    path: path.resolve(__dirname, "_dist", "js"),
    filename: process.env.ENV === "production" ? "[name].[contenthash].js" : "[name].js",
  },
  devtool: "source-map",
  resolve: {
    fullySpecified: false,
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  optimization: {
    minimizer:
      process.env.ENV === "production"
        ? [
            new TerserPlugin({
              exclude: /[\\/]node_modules[\\/]/,
              extractComments: false,
            }),
          ]
        : [],
  },
  plugins: [
    new WebpackManifestPlugin({
      publicPath: "js/",
      fileName: path.resolve(__dirname, "src/data", "manifest-js.json"),
    }),
  ],
}
