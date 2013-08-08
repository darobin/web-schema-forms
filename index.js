
var swig = require("swig")
,   pth = require("path")
,   fs = require("fs")
;

// TODO
// configure an inheritance line so that templates can specialise their parent
// there is a root template that essentially does nothing except walk the schema tree
// and call the right inner templates
// precompile templates?


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

// handle inheritance
exports.inheritance = ["root", "basic"];

exports.init = function () {
    if (exports.inheritance[0] !== "root") exports.inheritance.unshift("root");
    swig.init({
        extensions: {
            isArray:    function (obj) {
                return Object.prototype.toString.call(obj) === "[object Array]";
            }
        }
    });

    // macros
    fs.readdirSync(pth.join(__dirname, "macros"))
      .forEach(function (it) {
          if (!/\.html$/.test(it)) return;
          swig.compile(fs.readFileSync(pth.join(__dirname, "macros", it), "utf8"), { filename: "macros/" + it });
      });
    
    var previousLevel;
    for (var i = 0, n = exports.inheritance.length; i < n; i++) {
        var level = exports.inheritance[i];
        for (var k in sources[level].html) {
            var content = previousLevel ? "{% extends '" + previousLevel + "/" + k + "' %}" : "";
            content += sources[level].html[k];
            sources[level].templates[k] = swig.compile(content, { filename: level + "/" + k});
        }
        previousLevel = level;
    }
};

exports.form = function (schema, hints) {
    if (!hints) hints = {};
    // start with schema.html template that's last in inheritance
    var tpl, idx = exports.inheritance.length;
    while (!tpl && idx > 0) {
        idx--;
        tpl = sources[exports.inheritance[idx]].templates["schema.html"];
    }
    var inheritanceTop = {};
    for (var k in sources.root.html) {
        var idx = exports.inheritance.length;
        while (idx > 0) {
            idx--;
            if (sources[exports.inheritance[idx]].html[k]) {
                inheritanceTop[k.replace(".html", "")] = exports.inheritance[idx] + "/" + k;
                break;
            }
        }
    }
    if (!tpl) throw new Error("No schema.html template in inheritance tree.");
    return tpl({ schema: schema, inheritanceTop: inheritanceTop, hints: hints });
};
