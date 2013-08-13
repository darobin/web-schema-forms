
# Web Schema Forms

Web Schema is a technology that is used to describe data on the Web in a way that is intended to
minimise impedance mismatch between the various uses of Web data (forms, DB, validation, APIs…).

Web Schema Forms converts Web Schema documents to HTML forms. Most systems that generate forms from
schemata are either very limited, or when they have advanced features they tend to be linked to
client-side dependencies that might not match what you prefer to use in your system. It can also
be difficult to modify or enhance the behaviour of generated forms. This package tries very hard to
work around those problems in order to enable the generic form generator. It does this by relying
on jQuery (on the server side) to make it easy for extensions to simply enhance the markup. There
are of course limits to how flexible this approach is, and if an extension modifies the markup too
much others won't be able to bring their enhancements. But if you apply sane changes and are a
little bit defensive in terms of what you expect to find in the tree, you can easily extend the
form generation.

## Example usage

    var wsf = require("web-schema-forms")
    ,   bootstrap = require("web-schema-forms-bootstrap")
    ,   angular = require("web-schema-forms-angular")
    ;

    var form = WSF.form({
                            extensions: [bootstrap.horizontal, angular]
                        ,   schema: { ... } // web schema
                        ,   hints:  { ... } // rendering hints
                        }
                    ,   function (err, form) {
                            if (err) return console.log("ERROR", err);
                            // use the form here, it's just generated HTML
                        }
    );

## Installation

    npm install web-schema-forms

## API

### form(context, callback)

This is the core functionality that takes a schema and returns a string representing an HTML
form.

It takes two parameters:
* ```context```. A configuration object that defines the processing that must happen (and is also
  passed to items in the pipeline). It is comprised of the following fields:
    * ```schema```. A Web Schema. Note that Web Schema is still evolving technology at this time,
      and so this package will evolve to match. Breaking changes are still possible.
    * ```hints```. Optionally some hints can be provided in order to better control the behaviour of
      the templates. Currently the only supported hint is ```form_attrs``` which is an object the
      keys and values of which produce attributes on the ```<form>``` element. More hints will be 
      added so that the templating behaviour can be modified without having to write templates. Note
      that extensions are likely to add their own hints.
    * ```extensions```. An array of functions that will be called in turn with the context and a
      callback. The context is the one that was passed, plus a number of useful additional fields
      that are described in the Extensions section below.
* ```callback```. A callback that gets called with an error (null on success) and a string that is
  the generated form.

## Extensions

Extensions are functions that are given a context object and a callback. They may perform their
processing asynchronously if they need to, before calling the callback.

The context object has the same fields described above (and anything else you provide to 
```form()```), with the following ones added:
* ```$```. A jQuery object to manipulate the given document.
* ```$form```. The form object being generated. Note that normally you only need to worry about this
  but not about the rest of the document.

The callback expects to be called with an error (null on success) and a context.
