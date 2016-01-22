System.register(['seven-segment/7', 'angular2/core'], function(exports_1) {
    "use strict";
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var _7_1, core_1;
    var SevenSegmentDemoComponent;
    return {
        setters:[
            function (_7_1_1) {
                _7_1 = _7_1_1;
            },
            function (core_1_1) {
                core_1 = core_1_1;
            }],
        execute: function() {
            SevenSegmentDemoComponent = (function () {
                function SevenSegmentDemoComponent() {
                    this.hideMenu = false;
                    this.count = true;
                    this.digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                    this.d = new _7_1.Seven();
                }
                SevenSegmentDemoComponent.prototype.bar = function (val) {
                    return _7_1.Digit[val];
                };
                SevenSegmentDemoComponent.prototype.ngAfterViewInit = function () {
                    this.canvas = document.querySelector('canvas');
                    this.ctx = this.canvas.getContext('2d');
                    this.reset();
                    this.animate();
                };
                SevenSegmentDemoComponent.prototype.draw = function () {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.canvas.height = Math.ceil(this.d.height + 1);
                    this.canvas.width = Math.ceil(this.d.width + 1);
                    for (var _i = 0, _a = this.d.segments; _i < _a.length; _i++) {
                        var s = _a[_i];
                        this.ctx.fillStyle = "rgba(255,255,255," + (s.on ? .87 : .05) + ")";
                        this.ctx.beginPath();
                        for (var _b = 0, _c = s.points; _b < _c.length; _b++) {
                            var p = _c[_b];
                            this.ctx.lineTo(p.x + .5, p.y + .5);
                        }
                        this.ctx.closePath();
                        this.ctx.fill();
                    }
                };
                SevenSegmentDemoComponent.prototype.hide = function () {
                    this.hideMenu = !this.hideMenu;
                };
                Object.defineProperty(SevenSegmentDemoComponent.prototype, "code", {
                    get: function () {
                        return "var x = new Seven({\n  " + (this.d.isHeightFixed ? 'height' : 'width') + ": " + (this.d.isHeightFixed ? this.d.height : this.d.width) + ",\n  angle: " + this.d.angle + ",\n  ratioLtoW: " + this.d.ratioLtoW + ",\n  ratioLtoS: " + this.d.ratioLtoS + ",\n  digit: Digit." + _7_1.Digit[this.d.digit] + "\n})";
                    },
                    enumerable: true,
                    configurable: true
                });
                SevenSegmentDemoComponent.prototype.animate = function () {
                    var _this = this;
                    clearInterval(this.intHandle);
                    if (this.count) {
                        this.intHandle = setInterval(function () {
                            _this.d.digit = (_this.d.digit + 1) % 10;
                            _this.draw();
                        }, 1000);
                    }
                };
                SevenSegmentDemoComponent.prototype.reset = function () {
                    this.d = new _7_1.Seven();
                    this.draw();
                };
                SevenSegmentDemoComponent = __decorate([
                    core_1.Component({
                        selector: 'seven-segment-demo',
                        templateUrl: 'src/demo.component.html'
                    }), 
                    __metadata('design:paramtypes', [])
                ], SevenSegmentDemoComponent);
                return SevenSegmentDemoComponent;
            }());
            exports_1("SevenSegmentDemoComponent", SevenSegmentDemoComponent);
        }
    }
});
//# sourceMappingURL=demo.component.js.map