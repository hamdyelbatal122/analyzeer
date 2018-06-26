const path = require("path");
const LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = {
    entry: ["babel-polyfill", "./webapp/index.js"],
    mode: "development",
    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
        ]
    },
    plugins: [
        new LiveReloadPlugin({appendScriptTag:true})
    ],
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "webapp/dist")
    }
};
