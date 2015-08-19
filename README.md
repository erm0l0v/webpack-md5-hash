# webpack-md5-hash

[![NPM](https://nodei.co/npm/webpack-md5-hash.png)](https://npmjs.org/package/webpack-md5-hash)

Plugin to replace a standard webpack chunkhash with md5.

## Installation

```
npm install webpack-md5-hash --save-dev
```

## Usage

Just add this plugin as usual.

``` javascript

// webpack.config.js

var WebpackMd5Hash = require('webpack-md5-hash');

module.exports = {
    // ...
    output: {
        //...
        chunkFilename: "[chunkhash].[id].chunk.js"
    },
    plugins: [
        new WebpackMd5Hash()
    ]
};

```

And now instead of standard value of chunkhash you'll get a md5 based on chunk's modules.
