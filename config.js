System.config({
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
