const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    devtool: 'inline-source-map',
    mode: 'development',
    watchOptions: {
        ignored: /node_modules/, // Ignore node_modules for performance
        poll: 5000, // Poll every 1 second for file changes (adjust if needed)
    },
});