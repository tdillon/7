var Builder = require('systemjs-builder');
var builder = new Builder;

builder.config({
  baseURL: "/",
  defaultJSExtensions: true,
  transpiler: "none",
  paths: {
    "npm:*": "node_modules/*"
  },
  map: {
    "seven-segment": "npm:seven-segment"
  }
});

builder.buildStatic('javascripts/app', 'bundle.js', {
  runtime: false,
  minify: true,
  sourceMaps: false
});
