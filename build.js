"format global";
(function(global) {

  var defined = {};

  // indexOf polyfill for IE8
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  var getOwnPropertyDescriptor = true;
  try {
    Object.getOwnPropertyDescriptor({ a: 0 }, 'a');
  }
  catch(e) {
    getOwnPropertyDescriptor = false;
  }

  var defineProperty;
  (function () {
    try {
      if (!!Object.defineProperty({}, 'a', {}))
        defineProperty = Object.defineProperty;
    }
    catch (e) {
      defineProperty = function(obj, prop, opt) {
        try {
          obj[prop] = opt.value || opt.get.call(obj);
        }
        catch(e) {}
      }
    }
  })();

  function register(name, deps, declare) {
    if (arguments.length === 4)
      return registerDynamic.apply(this, arguments);
    doRegister(name, {
      declarative: true,
      deps: deps,
      declare: declare
    });
  }

  function registerDynamic(name, deps, executingRequire, execute) {
    doRegister(name, {
      declarative: false,
      deps: deps,
      executingRequire: executingRequire,
      execute: execute
    });
  }

  function doRegister(name, entry) {
    entry.name = name;

    // we never overwrite an existing define
    if (!(name in defined))
      defined[name] = entry;

    // we have to normalize dependencies
    // (assume dependencies are normalized for now)
    // entry.normalizedDeps = entry.deps.map(normalize);
    entry.normalizedDeps = entry.deps;
  }


  function buildGroups(entry, groups) {
    groups[entry.groupIndex] = groups[entry.groupIndex] || [];

    if (indexOf.call(groups[entry.groupIndex], entry) != -1)
      return;

    groups[entry.groupIndex].push(entry);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];

      // not in the registry means already linked / ES6
      if (!depEntry || depEntry.evaluated)
        continue;

      // now we know the entry is in our unlinked linkage group
      var depGroupIndex = entry.groupIndex + (depEntry.declarative != entry.declarative);

      // the group index of an entry is always the maximum
      if (depEntry.groupIndex === undefined || depEntry.groupIndex < depGroupIndex) {

        // if already in a group, remove from the old group
        if (depEntry.groupIndex !== undefined) {
          groups[depEntry.groupIndex].splice(indexOf.call(groups[depEntry.groupIndex], depEntry), 1);

          // if the old group is empty, then we have a mixed depndency cycle
          if (groups[depEntry.groupIndex].length == 0)
            throw new TypeError("Mixed dependency cycle detected");
        }

        depEntry.groupIndex = depGroupIndex;
      }

      buildGroups(depEntry, groups);
    }
  }

  function link(name) {
    var startEntry = defined[name];

    startEntry.groupIndex = 0;

    var groups = [];

    buildGroups(startEntry, groups);

    var curGroupDeclarative = !!startEntry.declarative == groups.length % 2;
    for (var i = groups.length - 1; i >= 0; i--) {
      var group = groups[i];
      for (var j = 0; j < group.length; j++) {
        var entry = group[j];

        // link each group
        if (curGroupDeclarative)
          linkDeclarativeModule(entry);
        else
          linkDynamicModule(entry);
      }
      curGroupDeclarative = !curGroupDeclarative; 
    }
  }

  // module binding records
  var moduleRecords = {};
  function getOrCreateModuleRecord(name) {
    return moduleRecords[name] || (moduleRecords[name] = {
      name: name,
      dependencies: [],
      exports: {}, // start from an empty module and extend
      importers: []
    })
  }

  function linkDeclarativeModule(entry) {
    // only link if already not already started linking (stops at circular)
    if (entry.module)
      return;

    var module = entry.module = getOrCreateModuleRecord(entry.name);
    var exports = entry.module.exports;

    var declaration = entry.declare.call(global, function(name, value) {
      module.locked = true;

      if (typeof name == 'object') {
        for (var p in name)
          exports[p] = name[p];
      }
      else {
        exports[name] = value;
      }

      for (var i = 0, l = module.importers.length; i < l; i++) {
        var importerModule = module.importers[i];
        if (!importerModule.locked) {
          for (var j = 0; j < importerModule.dependencies.length; ++j) {
            if (importerModule.dependencies[j] === module) {
              importerModule.setters[j](exports);
            }
          }
        }
      }

      module.locked = false;
      return value;
    });

    module.setters = declaration.setters;
    module.execute = declaration.execute;

    // now link all the module dependencies
    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];
      var depModule = moduleRecords[depName];

      // work out how to set depExports based on scenarios...
      var depExports;

      if (depModule) {
        depExports = depModule.exports;
      }
      else if (depEntry && !depEntry.declarative) {
        depExports = depEntry.esModule;
      }
      // in the module registry
      else if (!depEntry) {
        depExports = load(depName);
      }
      // we have an entry -> link
      else {
        linkDeclarativeModule(depEntry);
        depModule = depEntry.module;
        depExports = depModule.exports;
      }

      // only declarative modules have dynamic bindings
      if (depModule && depModule.importers) {
        depModule.importers.push(module);
        module.dependencies.push(depModule);
      }
      else
        module.dependencies.push(null);

      // run the setter for this dependency
      if (module.setters[i])
        module.setters[i](depExports);
    }
  }

  // An analog to loader.get covering execution of all three layers (real declarative, simulated declarative, simulated dynamic)
  function getModule(name) {
    var exports;
    var entry = defined[name];

    if (!entry) {
      exports = load(name);
      if (!exports)
        throw new Error("Unable to load dependency " + name + ".");
    }

    else {
      if (entry.declarative)
        ensureEvaluated(name, []);

      else if (!entry.evaluated)
        linkDynamicModule(entry);

      exports = entry.module.exports;
    }

    if ((!entry || entry.declarative) && exports && exports.__useDefault)
      return exports['default'];

    return exports;
  }

  function linkDynamicModule(entry) {
    if (entry.module)
      return;

    var exports = {};

    var module = entry.module = { exports: exports, id: entry.name };

    // AMD requires execute the tree first
    if (!entry.executingRequire) {
      for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
        var depName = entry.normalizedDeps[i];
        var depEntry = defined[depName];
        if (depEntry)
          linkDynamicModule(depEntry);
      }
    }

    // now execute
    entry.evaluated = true;
    var output = entry.execute.call(global, function(name) {
      for (var i = 0, l = entry.deps.length; i < l; i++) {
        if (entry.deps[i] != name)
          continue;
        return getModule(entry.normalizedDeps[i]);
      }
      throw new TypeError('Module ' + name + ' not declared as a dependency.');
    }, exports, module);

    if (output)
      module.exports = output;

    // create the esModule object, which allows ES6 named imports of dynamics
    exports = module.exports;
 
    if (exports && exports.__esModule) {
      entry.esModule = exports;
    }
    else {
      entry.esModule = {};
      
      // don't trigger getters/setters in environments that support them
      if ((typeof exports == 'object' || typeof exports == 'function') && exports !== global) {
        if (getOwnPropertyDescriptor) {
          var d;
          for (var p in exports)
            if (d = Object.getOwnPropertyDescriptor(exports, p))
              defineProperty(entry.esModule, p, d);
        }
        else {
          var hasOwnProperty = exports && exports.hasOwnProperty;
          for (var p in exports) {
            if (!hasOwnProperty || exports.hasOwnProperty(p))
              entry.esModule[p] = exports[p];
          }
         }
       }
      entry.esModule['default'] = exports;
      defineProperty(entry.esModule, '__useDefault', {
        value: true
      });
    }
  }

  /*
   * Given a module, and the list of modules for this current branch,
   *  ensure that each of the dependencies of this module is evaluated
   *  (unless one is a circular dependency already in the list of seen
   *  modules, in which case we execute it)
   *
   * Then we evaluate the module itself depth-first left to right 
   * execution to match ES6 modules
   */
  function ensureEvaluated(moduleName, seen) {
    var entry = defined[moduleName];

    // if already seen, that means it's an already-evaluated non circular dependency
    if (!entry || entry.evaluated || !entry.declarative)
      return;

    // this only applies to declarative modules which late-execute

    seen.push(moduleName);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      if (indexOf.call(seen, depName) == -1) {
        if (!defined[depName])
          load(depName);
        else
          ensureEvaluated(depName, seen);
      }
    }

    if (entry.evaluated)
      return;

    entry.evaluated = true;
    entry.module.execute.call(global);
  }

  // magical execution function
  var modules = {};
  function load(name) {
    if (modules[name])
      return modules[name];

    // node core modules
    if (name.substr(0, 6) == '@node/')
      return require(name.substr(6));

    var entry = defined[name];

    // first we check if this module has already been defined in the registry
    if (!entry)
      throw "Module " + name + " not present.";

    // recursively ensure that the module and all its 
    // dependencies are linked (with dependency group handling)
    link(name);

    // now handle dependency execution in correct order
    ensureEvaluated(name, []);

    // remove from the registry
    defined[name] = undefined;

    // exported modules get __esModule defined for interop
    if (entry.declarative)
      defineProperty(entry.module.exports, '__esModule', { value: true });

    // return the defined module object
    return modules[name] = entry.declarative ? entry.module.exports : entry.esModule;
  };

  return function(mains, depNames, declare) {
    return function(formatDetect) {
      formatDetect(function(deps) {
        var System = {
          _nodeRequire: typeof require != 'undefined' && require.resolve && typeof process != 'undefined' && require,
          register: register,
          registerDynamic: registerDynamic,
          get: load, 
          set: function(name, module) {
            modules[name] = module; 
          },
          newModule: function(module) {
            return module;
          }
        };
        System.set('@empty', {});

        // register external dependencies
        for (var i = 0; i < depNames.length; i++) (function(depName, dep) {
          if (dep && dep.__esModule)
            System.register(depName, [], function(_export) {
              return {
                setters: [],
                execute: function() {
                  for (var p in dep)
                    if (p != '__esModule' && !(typeof p == 'object' && p + '' == 'Module'))
                      _export(p, dep[p]);
                }
              };
            });
          else
            System.registerDynamic(depName, [], false, function() {
              return dep;
            });
        })(depNames[i], arguments[i]);

        // register modules in this bundle
        declare(System);

        // load mains
        var firstLoad = load(mains[0]);
        if (mains.length > 1)
          for (var i = 1; i < mains.length; i++)
            load(mains[i]);

        if (firstLoad.__useDefault)
          return firstLoad['default'];
        else
          return firstLoad;
      });
    };
  };

})(typeof self != 'undefined' ? self : global)
/* (['mainModule'], ['external-dep'], function($__System) {
  System.register(...);
})
(function(factory) {
  if (typeof define && define.amd)
    define(['external-dep'], factory);
  // etc UMD / module pattern
})*/

(['1'], [], function($__System) {

$__System.registerDynamic("2", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(Digit) {
    Digit[Digit["ZERO"] = 0] = "ZERO";
    Digit[Digit["ONE"] = 1] = "ONE";
    Digit[Digit["TWO"] = 2] = "TWO";
    Digit[Digit["THREE"] = 3] = "THREE";
    Digit[Digit["FOUR"] = 4] = "FOUR";
    Digit[Digit["FIVE"] = 5] = "FIVE";
    Digit[Digit["SIX"] = 6] = "SIX";
    Digit[Digit["SEVEN"] = 7] = "SEVEN";
    Digit[Digit["EIGHT"] = 8] = "EIGHT";
    Digit[Digit["NINE"] = 9] = "NINE";
    Digit[Digit["BLANK"] = 10] = "BLANK";
    Digit[Digit["D"] = 11] = "D";
  })(exports.Digit || (exports.Digit = {}));
  var Digit = exports.Digit;
  var Segment = (function() {
    function Segment() {
      this.on = false;
      this.points = [{
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }];
    }
    Object.defineProperty(Segment.prototype, "off", {
      get: function() {
        return !this.on;
      },
      enumerable: true,
      configurable: true
    });
    return Segment;
  })();
  exports.Segment = Segment;
  var Seven = (function() {
    function Seven(_a) {
      var _b = _a === void 0 ? {} : _a,
          _c = _b.segmentLength,
          segmentLength = _c === void 0 ? 50 : _c,
          _d = _b.angle,
          angle = _d === void 0 ? 10 : _d,
          _e = _b.ratioLtoW,
          ratioLtoW = _e === void 0 ? 4 : _e,
          _f = _b.ratioLtoS,
          ratioLtoS = _f === void 0 ? 32 : _f,
          _g = _b.digit,
          digit = _g === void 0 ? Digit.BLANK : _g;
      this._horizontalSegmentGeometry = [{
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }];
      this._verticalSegmentGeometry = [{
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }];
      this._translations = [{
        x: 0,
        y: 0,
        a: this._horizontalSegmentGeometry
      }, {
        x: 0,
        y: 0,
        a: this._verticalSegmentGeometry
      }, {
        x: 0,
        y: 0,
        a: this._verticalSegmentGeometry
      }, {
        x: 0,
        y: 0,
        a: this._horizontalSegmentGeometry
      }, {
        x: 0,
        y: 0,
        a: this._verticalSegmentGeometry
      }, {
        x: 0,
        y: 0,
        a: this._verticalSegmentGeometry
      }, {
        x: 0,
        y: 0,
        a: this._horizontalSegmentGeometry
      }];
      this.segments = [new Segment(), new Segment(), new Segment(), new Segment(), new Segment(), new Segment(), new Segment()];
      this._angleDegree = angle;
      this.digit = digit;
      this._segmentLength = segmentLength;
      this._ratioLtoW = ratioLtoW;
      this._ratioLtoS = ratioLtoS;
      this._positionSegments();
    }
    Seven.prototype._checkConfig = function() {
      var a;
      var b;
      a = this._segmentLength;
      b = a * 1;
      if (b != a || (typeof a === 'string' && a.toString().trim() === '')) {
        throw new TypeError("Invalid value (" + a + ") for segment length, not a number.");
      } else if (b <= 0) {
        throw new RangeError("Invalid value (" + b + ") for segment length, must be greater than 0.");
      } else if (!isFinite(b)) {
        throw new RangeError("Invalid value (" + b + ") for segment length, must be finite.");
      }
      this._segmentLength = b;
      a = this._angleDegree;
      b = a * 1;
      if (b != a || (typeof a === 'string' && a.toString().trim() === '')) {
        throw new TypeError("Invalid value (" + a + ") for angle, not a number.");
      } else if (b <= -90 || b >= 90) {
        throw new RangeError("Invalid value (" + b + ") for angle, must be between 90 and -90 degrees.");
      }
      this._angleDegree = b;
      a = this._ratioLtoW;
      b = a * 1;
      if (b != a || (typeof a === 'string' && a.toString().trim() === '')) {
        throw new TypeError("Invalid value (" + a + ") for ratioLtoW, not a number.");
      } else if (b < 1) {
        throw new RangeError("Invalid value (" + b + ") for ratioLtoW, must be at least 1.");
      } else if (!isFinite(b)) {
        throw new RangeError("Invalid value (" + b + ") for ratioLtoW, must be finite.");
      }
      this._ratioLtoW = b;
      a = this._ratioLtoS;
      b = a * 1;
      if (b != a || (typeof a === 'string' && a.toString().trim() === '')) {
        throw new TypeError("Invalid value (" + a + ") for ratioLtoS, not a number.");
      } else if (b <= 0) {
        throw new RangeError("Invalid value (" + b + ") for ratioLtoS, must be greater than 0.");
      } else if (!isFinite(b)) {
        throw new RangeError("Invalid value (" + b + ") for ratioLtoS, must be finite.");
      }
      this._ratioLtoS = b;
    };
    Seven.prototype._calculateSegmentGeometry = function() {
      this._angleRadian = this._angleDegree * Math.PI / 180;
      this._spacing = (this.ratioLtoS === 0 ? 0 : this.segmentLength / this.ratioLtoS);
      var _segmentWidth = this.segmentLength / this.ratioLtoW;
      this._halfSegmentWidth = _segmentWidth / 2;
      this._segmentEndAngle = (Math.PI / 2 - this._angleRadian) / 2;
      this._segmentHorizontalShiftDistance = this._halfSegmentWidth * Math.tan(this._angleDegree >= 0 ? this._segmentEndAngle : Math.PI / 2 - this._segmentEndAngle);
      this._height = _segmentWidth + 2 * this.segmentLength * Math.cos(this._angleRadian) + 2 * this._spacing * (Math.sin(this._segmentEndAngle) + Math.cos(this._segmentEndAngle));
      this._width = 2 * this.segmentLength * Math.sin(Math.abs(this._angleRadian)) + 2 * this._spacing * Math.cos(this._angleDegree >= 0 ? this._segmentEndAngle : Math.PI / 2 - this._segmentEndAngle) + this.segmentLength + 2 * this._segmentHorizontalShiftDistance;
      var h = this._halfSegmentWidth;
      var l = this.segmentLength;
      var t = Math.tan(this._segmentEndAngle);
      this._horizontalSegmentGeometry[1].x = h / t;
      this._horizontalSegmentGeometry[1].y = this._horizontalSegmentGeometry[2].y = -h;
      this._horizontalSegmentGeometry[2].x = l - h * t;
      this._horizontalSegmentGeometry[3].x = l;
      this._horizontalSegmentGeometry[4].x = l - h / t;
      this._horizontalSegmentGeometry[4].y = this._horizontalSegmentGeometry[5].y = h;
      this._horizontalSegmentGeometry[5].x = h * t;
      if (this._horizontalSegmentGeometry[1].x > this._horizontalSegmentGeometry[2].x) {
        throw new RangeError("This digit configuration produces invalid geometry.  angle: " + this._angleDegree + ",   ratioLtoW: " + this._ratioLtoW + ",   ratioLtoS: " + this._ratioLtoS);
      }
      for (var i = 0,
          hPoint = void 0,
          vPoint = void 0; (hPoint = this._horizontalSegmentGeometry[i]) && (vPoint = this._verticalSegmentGeometry[i]); ++i) {
        vPoint.x = hPoint.x;
        vPoint.y = -hPoint.y;
      }
      var angle = this._angleRadian + Math.PI / 2;
      for (var _i = 0,
          _a = this._verticalSegmentGeometry; _i < _a.length; _i++) {
        var p = _a[_i];
        var tempX = p.x;
        var tempY = p.y;
        p.x = tempX * Math.cos(angle) - tempY * Math.sin(angle);
        p.y = tempX * Math.sin(angle) + tempY * Math.cos(angle);
      }
    };
    Seven.prototype._positionSegments = function() {
      this._checkConfig();
      this._calculateSegmentGeometry();
      var l = this.segmentLength;
      var aC = this._spacing * Math.cos(this._segmentEndAngle);
      var aS = this._spacing * Math.sin(this._segmentEndAngle);
      var x = this._translations;
      x[6].x = this._segmentHorizontalShiftDistance + l * Math.sin(Math.abs(this._angleRadian)) + (this._angleDegree >= 0 ? aC : aS);
      x[5].x = x[6].x - aS + l * Math.sin(this._angleRadian);
      x[0].x = x[5].x + aC;
      x[1].x = x[6].x + l + aC + l * Math.sin(this._angleRadian);
      x[2].x = x[6].x + l + aS;
      x[3].x = x[6].x + (aS - aC) - l * Math.sin(this._angleRadian);
      x[4].x = x[4].x = x[6].x - aC;
      x[0].y = this._halfSegmentWidth;
      x[1].y = x[0].y + aC;
      x[5].y = x[0].y + aS;
      x[6].y = x[5].y + l * Math.cos(this._angleRadian) + aC;
      x[2].y = x[6].y + aC;
      x[4].y = x[6].y + aS;
      x[3].y = x[4].y + l * Math.cos(this._angleRadian) + aC;
      for (var i = 0,
          s = void 0,
          t = void 0; (s = this.segments[i]) && (t = x[i]); ++i) {
        for (var j = 0,
            p = void 0,
            g = void 0; (p = s.points[j]) && (g = t.a[j]); ++j) {
          p.x = g.x + t.x;
          p.y = g.y + t.y;
        }
      }
    };
    Seven.prototype._set = function(prop, value) {
      var oldValue = this[prop];
      try {
        this[prop] = value;
        this._positionSegments();
      } catch (e) {
        this[prop] = oldValue;
        this._positionSegments();
        throw e;
      }
    };
    Object.defineProperty(Seven.prototype, "angle", {
      get: function() {
        return this._angleDegree;
      },
      set: function(value) {
        this._set('_angleDegree', value);
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(Seven.prototype, "segmentLength", {
      get: function() {
        return this._segmentLength;
      },
      set: function(value) {
        this._set('_segmentLength', value);
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(Seven.prototype, "ratioLtoW", {
      get: function() {
        return this._ratioLtoW;
      },
      set: function(value) {
        this._set('_ratioLtoW', value);
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(Seven.prototype, "ratioLtoS", {
      get: function() {
        return this._ratioLtoS;
      },
      set: function(value) {
        this._set('_ratioLtoS', value);
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(Seven.prototype, "digit", {
      get: function() {
        return this._digit;
      },
      set: function(value) {
        var newValue = value * 1;
        if (newValue != value || (typeof value === 'string' && value.toString().trim() === '')) {
          throw new TypeError("Invalid value (" + value + ") for digit, not a Digit.");
        } else if (Digit[newValue] === undefined) {
          throw new RangeError("Invalid value (" + newValue + ") for digit, must be a Digit.");
        }
        this._digit = newValue;
        for (var i = 0,
            s = void 0; s = this.segments[i]; ++i) {
          s.on = Seven.matrix[this._digit][i];
        }
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(Seven.prototype, "height", {
      get: function() {
        return this._height;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(Seven.prototype, "width", {
      get: function() {
        return this._width;
      },
      enumerable: true,
      configurable: true
    });
    Seven.matrix = [[true, true, true, true, true, true, false], [false, true, true, false, false, false, false], [true, true, false, true, true, false, true], [true, true, true, true, false, false, true], [false, true, true, false, false, true, true], [true, false, true, true, false, true, true], [true, false, true, true, true, true, true], [true, true, true, false, false, false, false], [true, true, true, true, true, true, true], [true, true, true, true, false, true, true], [false, false, false, false, false, false, false], [false, true, true, true, true, false, true]];
    return Seven;
  })();
  exports.Seven = Seven;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1", ["2"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _7_1 = $__require('2');
  var d = new _7_1.Seven();
  var canvas = document.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var inputs = document.querySelectorAll('input[type=range]');
  var eleAnimate = document.querySelector('input[type=checkbox]');
  var eleDigits = document.querySelector('select');
  var eleReset = document.querySelector('#btnReset');
  var eleMenu = document.querySelector('header');
  var eleMenuBtn = document.querySelector('#btnMenu');
  var eleCode = document.querySelector('code span');
  var eleMain = document.querySelector('main');
  var intHandle;
  function code() {
    eleCode.textContent = '{';
    for (var i = 0,
        ele = void 0; ele = inputs[i]; ++i) {
      eleCode.textContent += "\n  " + ele.dataset['p'] + ": " + ele.value + ",";
    }
    eleCode.textContent += "\n  digit: Digit." + _7_1.Digit[eleDigits.selectedIndex] + "\n}";
  }
  function reset() {
    d = new _7_1.Seven();
    for (var i = 0,
        ele = void 0; ele = inputs[i]; ++i) {
      ele.value = d[ele.dataset['p']];
      document.querySelector("span[data-p=" + ele.dataset['p'] + "]").textContent = ele.value;
    }
    eleAnimate.checked = false;
    eleDigits.selectedIndex = d.digit;
    clearInterval(intHandle);
    eleCode.textContent = '';
    draw(canvas, ctx, d);
  }
  function draw(canvas, ctx, digit) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.height = Math.ceil(digit.height + 1);
    canvas.width = Math.ceil(digit.width + 1);
    for (var _i = 0,
        _a = digit.segments; _i < _a.length; _i++) {
      var s = _a[_i];
      ctx.fillStyle = "rgba(255,255,255," + (s.on ? .87 : .05) + ")";
      ctx.beginPath();
      for (var _b = 0,
          _c = s.points; _b < _c.length; _b++) {
        var p = _c[_b];
        ctx.lineTo(p.x + .5, p.y + .5);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  reset();
  for (var i = 0,
      inp = void 0; inp = inputs[i]; ++i) {
    inp.addEventListener('input', function(e) {
      var ele = (e.target);
      try {
        d[ele.dataset['p']] = parseFloat(ele.value);
        draw(canvas, ctx, d);
      } catch (ex) {
        ele.value = d[ele.dataset['p']];
        console.log(ex.message);
      }
      document.querySelector("span[data-p=" + ele.dataset['p'] + "]").textContent = ele.value;
      code();
    });
  }
  eleAnimate.addEventListener('change', function() {
    if (eleAnimate.checked) {
      intHandle = setInterval(function() {
        d.digit = (d.digit + 1) % 10;
        eleDigits.selectedIndex = d.digit;
        draw(canvas, ctx, d);
        code();
      }, 1000);
    } else {
      clearInterval(intHandle);
    }
  });
  eleDigits.addEventListener('change', function() {
    d.digit = eleDigits.selectedIndex;
    draw(canvas, ctx, d);
    code();
  });
  eleReset.addEventListener('click', reset);
  eleMenuBtn.addEventListener('click', function() {
    eleMenu.classList.toggle('hide');
  });
  eleMain.addEventListener('click', function() {
    eleMenu.classList.add('hide');
  });
  global.define = __define;
  return module.exports;
});

})
(function(factory) {
  factory();
});
//# sourceMappingURL=build.js.map