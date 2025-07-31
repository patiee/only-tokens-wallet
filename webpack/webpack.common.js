const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = {
    entry: {
      popup: path.join(srcDir, 'popup.tsx'),
      background: path.join(srcDir, 'background.ts'),
      ex_script: path.join(srcDir, 'ex_script.tsx'),
      create_password: path.join(srcDir, 'views/start/create_password.tsx'),
      create_mnemonic: path.join(srcDir, 'views/start/create_mnemonic.tsx'),
      start: path.join(srcDir, 'views/start/start.tsx'),
      utils: path.join(srcDir, 'utils.ts'),
      start: path.join(srcDir, 'views/dashboard/dashboard.tsx'),
    },
    output: {
        path: path.join(__dirname, "../dist/js"),
        filename: "[name].js",
    },
    optimization: {
        splitChunks: {
            name: "vendor",
            chunks(chunk) {
              return chunk.name !== 'background';
            }
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
          fallback: {
            crypto: false,
            fs: false,
            stream: false,
        },
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: ".", to: "../", context: "public" }],
            options: {},
        }),
        new NodePolyfillPlugin()
    ]
};
