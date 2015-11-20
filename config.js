System.config({
  baseURL: "/",
  defaultJSExtensions: true,
  transpiler: "none",
  paths: {
    "npm:*": "jspm_packages/npm/*"
  },

  map: {
    "seven-segment": "npm:seven-segment@3.0.2"
  }
});
