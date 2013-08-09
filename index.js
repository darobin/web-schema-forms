
var swig = require("swig")
,   pth = require("path")
,   fs = require("fs")
;

// register sources and all of their templates
var sources = {};

exports.register = function (name, path) {
    sources[name] = { path: path, html: {}, templates: {} };
    fs.readdirSync(path)
      .forEach(function (it) {
          if (!/\.html$/.test(it)) return;
          sources[name].html[it] = fs.readFileSync(pth.join(path, it), "utf8");
      });
};

exports.register("root", pth.resolve(pth.join(__dirname, "root")));
exports.register("basic", pth.resolve(pth.join(__dirname, "basic")));

// helper
function isArray (obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
}

exports.form = function (inheritance, schema, hints) {
    // the first parameter is optional
    if (!isArray(inheritance)) {
        schema = inheritance;
        hints = schema;
        inheritance = ["root", "basic"];
    }
    if (!schema) throw new Error("Can't convert schema if no schema is given.");
    if (!hints) hints = {};
    if (inheritance[0] !== "root") inheritance.unshift("root");
    swig.init({
        extensions: {
            isArray: isArray
        }
    });

    // finds what template to inherit from
    function findInherit (start, file, want) {
        while (start > 0) {
            start--;
            if (sources[inheritance[start]].html[file]) {
                if (want === "file") return inheritance[start] + "/" + file;
                if (want === "html") return sources[inheritance[start]].html[file];
                if (want === "template") return sources[inheritance[start]].templates[file];
                if (want === "source") return inheritance[start];
            }
        }
        return null;
    }

    // macros
    fs.readdirSync(pth.join(__dirname, "macros"))
      .forEach(function (it) {
          if (!/\.html$/.test(it)) return;
          swig.compile(fs.readFileSync(pth.join(__dirname, "macros", it), "utf8"), { filename: "macros/" + it });
      });

    // for each template from each source, make it inherit from its real parent (if any)
    for (var idx = 0, n = inheritance.length; idx < n; idx++) {
        var src = sources[inheritance[idx]];
        for (var k in src.html) {
            var parent = findInherit(idx, k, "file")
            ,   content = (parent ? "{% extends '" + parent + "' %}" : "") + src.html[k]
            ;
            src.templates[k] = swig.compile(content, { filename: inheritance[idx] + "/" + k});
        }
    }

    // start with schema.html template that's last in inheritance
    var tpl = findInherit(inheritance.length, "schema.html", "template");
    if (!tpl) throw new Error("No schema.html template in inheritance tree.");

    // need to list all templates at all levels, and for each find the topmost
    var inheritanceTop = {}, allHTML = {}, listHTML = [];
    for (var i = 0, n = inheritance.length; i < n; i++) {
        for (var k in sources[inheritance[i]].html) allHTML[k] = true;
    }
    for (var k in allHTML) listHTML.push(k);
    for (var i = 0, n = listHTML.length; i < n; i++) {
        var html = listHTML[i];
        inheritanceTop[html.replace(".html", "")] = findInherit(inheritance.length, html, "file");
    }

    return tpl({ schema: schema, inheritanceTop: inheritanceTop, hints: hints });
};
