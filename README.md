
# Web Schema Forms

Web Schema is a technology that is used to describe data on the Web in a way that is intended to
minimise impedance mismatch between the various uses of Web data (forms, DB, validation, APIs…).

Web Schema Forms converts Web Schema documents to HTML forms. Most systems that generate forms from
schemata are either very limited, or when they have advanced features they tend to be linked to
client-side dependencies that might not match what you prefer to use in your system. It can also
be difficult to modify or enhance the behaviour of generated forms. This package tries very hard to
work around those problems in order to enable the generic form generator. It does this by relying
on the powerful Swig templating system, that notably supports very flexible template inheritance
and extensions.

## Example usage

    var wsf = require("web-schema-forms");
    wsf.loadPlugin(require("web-schema-forms-bootstrap"));

    var form = WSF.form(["basic", "bootstrap"],
                        {
                          // web schema...
                        }
    ));

## Installation

    npm install web-schema-forms

## API

### form([inheritance], schema, [hints])

This is the core functionality that takes a schema and returns a string representing an HTML
form. (Note that there is nothing HTML-specific in the fundamental code; if you produce a set of
templates that inherits directly from ```root``` instead of ```basic``` then you can generate pretty
much anything you want from a schema.)

It takes three parameters, the first and last of which are optional:
* ```inheritance```. An array that describes the inheritance line of templates. If left unspecified,
  defaults to ```["root", "basic"]``` which will produce very bare bones HTML. If you wanted to use
  the Bootstrap and AngulasJS plugins together (so that your forms use both of these technologies)
  then you would specify ```["basic", "bootstrap", "angular"]``` (the order of the two latter does
  not matter much). You don't need to start with ```root```, it gets added for you.
* ```schema```. A Web Schema. Note that Web Schema is still evolving technology at this time, and
  so this package will evolve to match. Breaking changes are still possible.
* ```hints```. Optionally some hints can be provided in order to better control the behaviour of the
  templates. Currently the only supported hint is ```form_attrs``` which is an object the keys and
  values of which produce attributes on the ```<form>``` element. More hints will be added so that
  the templating behaviour can be modified without having to write templates.

### register(name, path)

This registers a source of templates. Typically a plugin will call that in order to tell Web Schema
Forms where its templates are, and for what key.

If you write your own extensions, you can call this directly to add your set of templates, without
having to create a plugin.

Parameters:
* ```name```. The simple name for that template set, like ```root``` or ```basic```.
* ```path```. The path to the directory containing the templates.

### loadPlugin(plugin)

Load a plugin by specifying the plugin object. A plugin can be absolutely any object that responds
to the API defined in the next section (it does not need to be a module for instance). Note that
unless you want to somehow package and distribute them, you do not need to create a plugin in order
to produce extensions; you can simply register your templates directly.

Parameters:
* ```plugin```. A plugin object.

## Plugin API

The plugin API is extremely simple. A typical plugin will mostly be composed of templates, with the
code simply serving as glue.

### init(wsf)

Takes a Web Schema Forms instance and isn't expected to return anything. In the typical case, it
will simply call ```register()``` on the provided object in order to configure the location of its
templates set.

## Writing plugins

Most of the complexity involved in plugins is in the writing of forms.

XXX
  - link to Swig
  - don't use extend, and use special import
  - available information: schema, hints, path

