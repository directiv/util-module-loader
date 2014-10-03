/**
 * Module dependencies
 */

var parser = require('directiv-core-parser');
var compiler = require('minidom-compiler');
var read = require('fs').readFileSync;
var template = read(__dirname + '/template.js', 'utf8');

module.exports = loader;

function loader(source) {
  this.cacheable && this.cacheable();
  var ast = parser(source);

  var conf = format(ast);
  var PRE = process.env.NODE_ENV === 'development' ?
        '' :
        'require.ensure(DEPS, function(require) {';
  var POST = process.env.NODE_ENV === 'development' ?
        '' :
        '});';

  var OUT = JSON.stringify(compiler(conf.template.ast, {removeComments: true}));

  var str = template
        .replace('PRE_WRAPPER', PRE)
        .replace('POST_WRAPPER', POST)
        .replace(/OUT/g, OUT)
        .replace('DEPS', conf.deps)
        .replace(/REQUIRES/g, conf.requires)
        .replace('FILE', '"' + this.resourcePath + '"');

  return str;
};

function format(ast) {
  var conf = ast.reduce(function(acc, node) {
    if (node.type !== 'tag' && node.type !== 'script') return acc;
    if (node.tag === 'script') {
      acc.deps.push({
        path: node.props.src,
        params: node.props.params,
        as: node.props.as || node.props.name
      });
    }
    if (node.tag === 'link' && node.props.rel === 'import') {
      acc.imports.push({
        path: node.props.href,
        as: node.props.as || node.props.name
      });
    }
    // TODO stylesheets
    if (node.tag === 'template') {
      acc.template = {
        ast: node.children,
        params: formatParams(node.params)
      };
    }
    if (node.tag === 'head') {
      acc.head = {
        ast: node.children
      };
    }
    return acc;
  }, {
    deps: [],
    imports: [],
    stylesheets: [],
    template: {
      ast: []
    }
  });

  var deps = conf.deps;
  var imports = conf.imports;
  conf.deps = JSON.stringify(deps.map(formatDep));
  conf.requires =
    deps.reduce(formatDepRequire, '') +
    imports.reduce(formatImportRequire, '');

  return conf;
}

function formatDep(dep) {
  return dep.path;
}

function formatDepRequire(acc, dep) {
  var as = '"' + (dep.as || '') + '"';
  var params = dep.params ?
        ', {' + dep.params + '}' :
        '';
  return acc + 'tmpl.use(' + as + ', require(' + JSON.stringify(dep.path) + ')' + params + ');\n';
}

function formatImportRequire(acc, dep) {
  var as = '"' + (dep.as || '') + '"';
  var params = dep.params ?
        ', {' + dep.params + '}' :
        '';
  return acc + 'tmpl.use(' + as + ', require(' + JSON.stringify('directiv-util-module-loader!' + dep.path) + ')' + params + ');\n';
}

function formatParams(params) {
  return params || '';
}
