
var swig = require("swig")
,   pth = require("path")
;

// TODO
// configure an inheritance line so that templates can specialise their parent
// there is a root template that essentially does nothing except walk the schema tree
// and call the right inner templates
// precompile templates?

var sources = {
    root:   pth.resolve(pth.join(__dirname, "root"))
,   basic:  pth.resolve(pth.join(__dirname, "basic"))
};

function Builder (conf) {
    if (!conf) conf = {};
    if (!conf.inheritance) conf.inheritance = ["root", "basic"];
    if (conf.inheritance[0] !== "root") conf.inheritance.unshift("root");
    swig.init({
        root:   conf.inheritance
                    .reverse()
                    .map(function (it) { return sources[it]; })
    });
}

// registers template sources for inheritance
Builder.register = function (name, path) {
    sources[name] = path;
};

Builder.prototype.form = function (schema) {
    return swig.compileFile("schema.html")({ schema: schema });
};

exports = Builder;
