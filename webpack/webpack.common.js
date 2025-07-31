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
      create_password: path.join(srcDir, 'create_password.tsx'),
      create_mnemonic: path.join(srcDir, 'create_mnemonic.tsx'),
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
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: ".", to: "../", context: "public" }],
            options: {},
        }),
        new NodePolyfillPlugin()
    ],
};
