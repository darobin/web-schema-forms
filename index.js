/*jshint es5: true*/

var jsdom = require("jsdom")
,   async = require("async")
,   pth = require("path")
;

// helpers
function isArray (obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
}

function makePath (context) {
    if (!context.path.length) return "$root";
    return context.path.join(".");
}

function addDivAndLabel (context, type, annot) {
    var $ = context.window.$
    ,   $div = $("<div></div>")
    ,   $label = $("<label></label>")
    ;
    $div.attr("data-wsf-type", annot);
    $label.attr("for", makePath(context)).text(type.description).appendTo($div);
    context.$form.append($div);
    return $div;
}

function attrsIfExist ($el, obj) {
    for (var k in obj) if (obj.hasOwnProperty(k) && obj[k] != null) $el.attr(k, obj[k]);
}

function basicInput (state, context, type, $parent, attrsMap) {
    var $input = state === "textarea" ? context.window.$("<textarea></textarea>") : context.window.$("<input>")
    ,   path = makePath(context)
    ,   attrsMap = attrsMap ? attrsMap : {}
    ;
    if (state !== "textarea") $input.attr("type", state);
    $input.attr({ id: path, name: path });
    attrsMap.required = type.required ? "required" : null;
    attrsIfExist($input, attrsMap);
    $parent.append($input);
    return $input;
}

function renderType (context, type) {
    var $ = context.window.$
    ,   path = makePath(context)
    ;
    if (type.enum) {
        var $div = addDivAndLabel(context, type, "enum-" + type.type)
        ,   $select = $("<select></select>")
        ;
        $select.attr({ id: path, name: path });
        if (type.required)  $select.attr("required", "required");
        else                $select.append("<option></option>");
        for (var i = 0, n = type.enum.length; i < n; i++) {
            $("<option></option>").text(type.enum[i]).appendTo($select);
        }
        $div.append($select);
    }
    else if (type.type === "string" || type.type === "text") {
        var $div = addDivAndLabel(context, type, type.type);
        basicInput(type.type === "string" ? "text" : "textarea", context, type, $div, {
            pattern:    type.pattern
        ,   minlength:  type.minLength
        ,   maxlength:  type.maxLength
        });
    }
    else if (type.type === "number") {
        var $div = addDivAndLabel(context, type, type.type);
        basicInput("number", context, type, $div, {
            min:    type.minimum
        ,   max:    type.maximum
        });
    }
    else if (type.type === "boolean") {
        var $div = addDivAndLabel(context, type, type.type);
        basicInput("checkbox", context, type, $div);
    }
    else if (type.type === "null") {
        var $div = addDivAndLabel(context, type, type.type);
        basicInput("hidden", context, type, $div);
    }
    else if (type.type === "link")  { throw new Error("Type link not yet supported"); } // XXX
    else if (type.type === "any")   { throw new Error("Type any not yet supported"); } // XXX
    else if (!type.type)            { throw new Error("Type any not yet supported"); } // XXX
    else if (isArray(type.type))    { throw new Error("Type union not yet supported"); } // XXX
    else if (type.type === "object") {
        var $oldForm;
        if (path !== "$root") {
            $oldForm = context.$form;
            context.$form = $("<fieldset data-wsf-type='object'></fieldset>").attr("id", path).appendTo($oldForm);
            $("<legend></legend>").text(type.description).appendTo(context.$form);
        }
        for (var name in type.properties) {
            if (type.properties.hasOwnProperty(name)) {
                context.path.push(name);
                renderType(context, type.properties[name]);
                context.path.pop();
            }
        }
        if (path !== "$root") {
            context.$form = $oldForm;
            $oldForm = null;
        }
    }
    else if (type.type === "array") { throw new Error("Type array not yet supported"); } // XXX
    else throw new Error("Unknown schema field type " + type.type + ".");
}

// basic processor
function basic (context, cb) {
    var win = jsdom.jsdom().parentWindow;
    jsdom.jQueryify(win, pth.resolve(pth.join(__dirname, "vendor/jquery-2.0.3.min.js")), function () {
        // make a form
        var $ = win.$
        ,   $form = $("<form></form>")
        ;
        $("body").append("<div id='wsf'></div>");
        $("#wsf").append($form);
        context.window = win;
        context.$form = $form;
        if (context.hints.form_attrs) $form.attr(context.hints.form_attrs);
        try {
            renderType(context, context.schema);
        }
        catch (e) {
            return cb(e);
        }
        $form.append($('<div data-wsf-type="actions"><input type="submit" value="Submit"></div>'));
        cb(null, context);
    });
    
}

exports.form = function (context, cb) {
    context.path = [];
    if (!context.schema) cb(new Error("Missing required schema."));
    if (!context.hints) context.hints = {};
    if (!context.pipeline) context.pipeline = [];
    context.pipeline.unshift(function (cb) { basic(context, cb); });
    async.waterfall(context.pipeline, function (err, context) {
        if (err) return cb(err);
        if (!context.window) return cb(new Error("Failed to produce a document."));
        cb(null, context.window.$("#wsf").html().replace(/<div/g, "\n  <div"));
    });
};
