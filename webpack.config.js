const path = require("path");

module.exports = {
    entry: "./webapp/index.js",
    mode: "production",
    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
        ]
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "webapp/dist")
    }
};
