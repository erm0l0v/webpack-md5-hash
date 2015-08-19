var md5 = require("md5");

function compareModules(a,b) {
    if (a.resource < b.resource)
        return -1;
    if (a.resource > b.resource)
        return 1;
    return 0;
}

function getModuleSource (module) {
    var _source = module._source || {};
    return _source._value || "";
}

function concatenateSource (result, module_source) {
    return result + module_source;
}

function WebpackMd5Hash () {

}

WebpackMd5Hash.prototype.apply = function(compiler) {
    compiler.plugin("compilation", function(compilation) {
        compilation.plugin("after-hash", function() {
            for (var chunk_id in this.chunks) {
                if (this.chunks.hasOwnProperty(chunk_id)) {
                    var chunk = this.chunks[chunk_id];
                    var source = chunk.modules.sort(compareModules).map(getModuleSource).reduce(concatenateSource);
                    chunk.renderedHash = md5(source);
                }
            }
        });
    });
};

module.exports = WebpackMd5Hash;