System.register(['zone.js/dist/zone.min.js', 'reflect-metadata', 'angular2/platform/browser', './demo.component'], function(exports_1) {
    "use strict";
    var browser_1, demo_component_1;
    return {
        setters:[
            function (_1) {},
            function (_2) {},
            function (browser_1_1) {
                browser_1 = browser_1_1;
            },
            function (demo_component_1_1) {
                demo_component_1 = demo_component_1_1;
            }],
        execute: function() {
            browser_1.bootstrap(demo_component_1.SevenSegmentDemoComponent);
        }
    }
});
//# sourceMappingURL=boot.js.map