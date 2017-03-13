# md5-hash-webpack-plugin

[![NPM](https://nodei.co/npm/md5-hash-webpack-plugin.png)](https://npmjs.org/package/md5-hash-webpack-plugin)

Plugin to replace a standard webpack chunkhash with md5.

Note: This is a clone of webpack-md5-hash plugin, but **re-implemented more correctly** (you shall see the reasons below).

## Installation

```
npm install md5-hash-webpack-plugin --save-dev
```

## Usage

Just add this plugin as usual.

``` javascript

// webpack.config.js

var MD5HashPlugin = require('md5-hash-webpack-plugin');

module.exports = {
    // ...
    output: {
        //...
        chunkFilename: "[chunkhash].[id].chunk.js"
    },
    plugins: [
        new MD5HashPlugin()
    ]
};

```

## Why it is more correct?

With the original `webpack-md5-hash`, you will eventually get an accident on production. It's building wrong chunk hash. [Check one of its issue here](https://github.com/erm0l0v/webpack-md5-hash/issues/5).

With investigation, found out that webpack chunk consists of following items (i.e. the output chunk content is affected by them):

- Module source codes (obviously)
- Module IDs (assigned by webpack, and both the module its own and its dependent modules')
- Webpack runtime (bootstrap code)
- Chunk ID

I'll explain each of them later, but it's too long. So first, I make the conclusion here:

- To make a chunk hash correct, it should depend on all of these related items.
- The original `webpack-md5-hash` calculates chunk hash depending on only `Module source code`, which means, if source code remains the same but some other items change, the chunk hash will be the same (incorrectly!). (To be short, chunk with different contents gets the same chunk hash, and happens very frequently.)

## Now Lets see what are these chunk related items

(If you read Chinese, you can see [details in my blog here](http://blog.yunfei.me/blog/webpack_long_term_caching.html).)

Let's check a real webpack chunk content:

```javascript
// main.js

/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/build/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(1);
	module.exports = 'entry.js';

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = 'test.js';

/***/ }
/******/ ]);
```

with a simple webpack.config.js with a single entry:

```javascript
// webpack.config.js
{
    entry: {main: './entry.js'},
    // ...
}
```

- First, we can see the **webpackBootstrap** function. Also called **webpack runtime** here. (But it seems not to contain any changable things. Patient, check below.)
- Next, we can see the modules passed as parameters to `webpackBootstrap` func. The comments `/* 0 */`, `/* 1 */` of each module is the **module id** (which is just array index here, and actually if the module ids can not be mapped to array index, webpack will turn modules into a map with module id as key instead of array.
- Then, inside each module it's the **module source code** (actually it's compiled from source code).
- And be aware that inside the module with id "0" (entry.js), there is `__webpack_require__(1)`, and that's referring to **its dependent module's id** (which is "test.js" here).
- Finnaly, **Chunk ID**, but we don't see it? Yes, it only appears if you have multiple chunks. Check below.

Now lets build another webpack.config.js with common chunks, and chunk hash:

```javascript
{
    entry: {main: './entry.js'},
    output: {
        filename: '[name].[chunkhash].js',
        // ...
    },
    plugins: [new CommonsChunkPlugin({name: 'common'})]
}
```

There will be two chunk files:

```javascript
// common.ee6a75cff93f09fd8df7.js

/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	var parentJsonpFunction = window["webpackJsonp"];
/******/ 	window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules) {
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, callbacks = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId])
/******/ 				callbacks.push.apply(callbacks, installedChunks[chunkId]);
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			modules[moduleId] = moreModules[moduleId];
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
/******/ 		while(callbacks.length)
/******/ 			callbacks.shift().call(null, __webpack_require__);
/******/ 		if(moreModules[0]) {
/******/ 			installedModules[0] = 0;
/******/ 			return __webpack_require__(0);
/******/ 		}
/******/ 	};

/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// object to store loaded and loading chunks
/******/ 	// "0" means "already loaded"
/******/ 	// Array means "loading", array contains callbacks
/******/ 	var installedChunks = {
/******/ 		1:0
/******/ 	};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}

/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId, callback) {
/******/ 		// "0" is the signal for "already loaded"
/******/ 		if(installedChunks[chunkId] === 0)
/******/ 			return callback.call(null, __webpack_require__);

/******/ 		// an array means "currently loading".
/******/ 		if(installedChunks[chunkId] !== undefined) {
/******/ 			installedChunks[chunkId].push(callback);
/******/ 		} else {
/******/ 			// start chunk loading
/******/ 			installedChunks[chunkId] = [callback];
/******/ 			var head = document.getElementsByTagName('head')[0];
/******/ 			var script = document.createElement('script');
/******/ 			script.type = 'text/javascript';
/******/ 			script.charset = 'utf-8';
/******/ 			script.async = true;

/******/ 			script.src = __webpack_require__.p + "" + chunkId + "." + ({"0":"e_1"}[chunkId]||chunkId) + "." + {"0":"46d49cca63fc8e1231fc"}[chunkId] + ".js";
/******/ 			head.appendChild(script);
/******/ 		}
/******/ 	};

/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/build/";
/******/ })
/************************************************************************/
/******/ ([]);
```

```javascript
// e_1.46d49cca63fc8e1231fc.js

webpackJsonp([0,1],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(1);
	module.exports = 'entry.js';

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = 'test.js';

/***/ }
]);
```

- In `common.ee6a75cff93f09fd8df7.js` we found **webpack bootstrap runtime** again, but now it contains some changable things. Check the `requireEnsure` function:
    `({"0":"entry"}[chunkId]||chunkId) + "." + {"0":"46d49cca63fc8e1231fc"}[chunkId] `. It's containing the **chunk_id - chunk_filename map**. And that's depending on each build.
- In `entry.46d49cca63fc8e1231fc.js` we found there's no webpack bootstrap func, but a `webpackJsonp`. In the parameters, there's also module definitions, and the first param `[0,1]` is just this `entry.46d49cca63fc8e1231fc.js` **chunk's ids** (sometimes it's a single chunk id, sometimes it's multiple)

## So what about this implementation?

This implementation calculates chunk hash based on:

- Module source code
- Module Ids and also their dependent module ids
- Chunk id

But, without webpack bootstrap runtime.

To solve this, you should make a standalone webpack bootstrap runtime with empty modules (or you could just extract only the changable filename map which may be called manifest), and inline it into final html output.

Anyway, we now get a more correct md5 chunk hash.
