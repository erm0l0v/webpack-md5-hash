"use strict";

var md5 = require("md5");

function compareModules(a,b) {
    if (a.id < b.id) {
        return -1;
    }
    if (a.id > b.id) {
        return 1;
    }
    return 0;
}

function getModuleSource (module) {
    return {
        id: module.id,
        source: (module._source || {})._value || '',
        dependencies: (module.dependencies || []).map(function(d){ return d.module ? d.module.id : ''; })
    };
}

function concatenateSource (result, module_source) {
    return result + '#' + module_source.id + '#' + module_source.source + (module_source.dependencies.join(','));
}

function chunkIdSource(chunk) {
    return '@' + (chunk.ids ? chunk.ids.join(',') : chunk.id) + '@';
}

function MD5HashPlugin () {

}

MD5HashPlugin.prototype.apply = function(compiler) {
    compiler.plugin("compilation", function(compilation) {
        compilation.plugin("chunk-hash", function(chunk, chunkHash) {
            var source = chunkIdSource(chunk) + chunk.modules.map(getModuleSource).sort(compareModules).reduce(concatenateSource, ''); // we provide an initialValue in case there is an empty module source. Ref: http://es5.github.io/#x15.4.4.21
            var chunk_hash = md5(source);
            chunkHash.digest = function () {
                return chunk_hash;
            };
        });
    });
};

module.exports = MD5HashPlugin;
