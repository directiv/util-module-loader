/**
 * Module dependencies
 */

var tmpl;
exports = module.exports = function(ready, Template, modules) {
  if (tmpl && tmpl.render) return tmpl;
  tmpl = new Template(ready, modules);

  PRE_WRAPPER
  var reader = require('minidom-reader');
  REQUIRES
  tmpl.compile(reader(OUT));
  POST_WRAPPER

  return tmpl;
};

exports.__template = true;
