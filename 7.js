(function (Digit) {
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
var Segment = (function () {
    function Segment() {
        this.on = false;
        this.points = [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 }
        ];
    }
    Object.defineProperty(Segment.prototype, "off", {
        get: function () {
            return !this.on;
        },
        enumerable: true,
        configurable: true
    });
    return Segment;
})();
exports.Segment = Segment;
/**
 * The Seven class represents the geometry of a seven segment digit.
 * The geometry uses a coordinate system that is a cartesian grid with
 *    -x values to the left of the origin,
 *    +x values to the right of the origin,
 *    +y values below the origin, and
 *    -y values above the origin.
 * This is the coordinate system typically used for computer graphic systems.
 */
var Seven = (function () {
    /**
     * Construct a new Seven object.
     * Optionally pass a SevenConfig object to set properties.
     * Each property of the SevenConfig object is optional.
     * If the passed in config contains bad values an exception will be thrown.
     */
    function Seven(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.segmentLength, segmentLength = _c === void 0 ? 50 : _c, _d = _b.angle, angle = _d === void 0 ? 10 : _d, _e = _b.ratioLtoW, ratioLtoW = _e === void 0 ? 4 : _e, _f = _b.ratioLtoS, ratioLtoS = _f === void 0 ? 32 : _f, _g = _b.digit, digit = _g === void 0 ? Digit.BLANK : _g;
        this._horizontalSegmentGeometry = [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 }
        ];
        this._verticalSegmentGeometry = [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 }
        ];
        this._translations = [
            { x: 0, y: 0, a: this._horizontalSegmentGeometry },
            { x: 0, y: 0, a: this._verticalSegmentGeometry },
            { x: 0, y: 0, a: this._verticalSegmentGeometry },
            { x: 0, y: 0, a: this._horizontalSegmentGeometry },
            { x: 0, y: 0, a: this._verticalSegmentGeometry },
            { x: 0, y: 0, a: this._verticalSegmentGeometry },
            { x: 0, y: 0, a: this._horizontalSegmentGeometry }
        ];
        this.segments = [new Segment(), new Segment(), new Segment(), new Segment(), new Segment(), new Segment(), new Segment()];
        this._angleDegree = angle;
        this.digit = digit;
        this._segmentLength = segmentLength;
        this._ratioLtoW = ratioLtoW;
        this._ratioLtoS = ratioLtoS;
        this._positionSegments();
    }
    /**
     * Check the segmentLength, angle, ratioLtoH, and ratioLtoS for valid values.
     * Throws exception on first found issue.
     *
     * @private
     */
    Seven.prototype._checkConfig = function () {
        var a;
        var b;
        //Check segment length
        a = this._segmentLength;
        b = a * 1; //convert to a number
        if (b != a || (typeof a === 'string' && a.toString().trim() === '')) {
            throw new TypeError("Invalid value (" + a + ") for segment length, not a number.");
        }
        else if (b <= 0) {
            throw new RangeError("Invalid value (" + b + ") for segment length, must be greater than 0.");
        }
        else if (!isFinite(b)) {
            throw new RangeError("Invalid value (" + b + ") for segment length, must be finite.");
        }
        this._segmentLength = b;
        //Check angle
        a = this._angleDegree;
        b = a * 1; //convert to a number
        if (b != a || (typeof a === 'string' && a.toString().trim() === '')) {
            throw new TypeError("Invalid value (" + a + ") for angle, not a number.");
        }
        else if (b <= -90 || b >= 90) {
            throw new RangeError("Invalid value (" + b + ") for angle, must be between 90 and -90 degrees.");
        }
        this._angleDegree = b;
        //Check ratioLtoW
        a = this._ratioLtoW;
        b = a * 1; //convert to a number
        if (b != a || (typeof a === 'string' && a.toString().trim() === '')) {
            throw new TypeError("Invalid value (" + a + ") for ratioLtoW, not a number.");
        }
        else if (b < 1) {
            throw new RangeError("Invalid value (" + b + ") for ratioLtoW, must be at least 1.");
        }
        else if (!isFinite(b)) {
            throw new RangeError("Invalid value (" + b + ") for ratioLtoW, must be finite.");
        }
        this._ratioLtoW = b;
        //Check ratioLtoS
        a = this._ratioLtoS;
        b = a * 1; //convert to a number
        if (b != a || (typeof a === 'string' && a.toString().trim() === '')) {
            throw new TypeError("Invalid value (" + a + ") for ratioLtoS, not a number.");
        }
        else if (b <= 0) {
            throw new RangeError("Invalid value (" + b + ") for ratioLtoS, must be greater than 0.");
        }
        else if (!isFinite(b)) {
            throw new RangeError("Invalid value (" + b + ") for ratioLtoS, must be finite.");
        }
        this._ratioLtoS = b;
    };
    /**
     * This method sets the following values for the object.
     * _angleRadian, _spacing, _halfSegmentWidth, _height, _width
     *
     * This method populates the _horizontalSegmentGeometry array.
     * The array contains the six points of the horizontal segment's geometry.
     * The first element in the array is the left most point.
     * The points are then listed in clockwise order.
     * All points besides the first have positive x values.
     * The first point is always at the origin (0,0).
     * The second and third points have negative y values;
     * The fourth point is always at (l, 0). where l is the segment length
     * The fifth and sixth points have positive y values.
     *
     * This method populates the _verticalSegmentGeometry array.
     * The array contains the six points of the vertical segment's geometry.
     * The first element in the array is the top most point.
     * The points are then listed in counterclockwise order.
     * All points besides the first have positive y values.
     * The first point is always at the origin (0,0).
     *
     * This method throws an error if the calculated geometry is unexpected.
     *
     * @private
     */
    Seven.prototype._calculateSegmentGeometry = function () {
        this._angleRadian = this._angleDegree * Math.PI / 180;
        this._spacing = (this.ratioLtoS === 0 ? 0 : this.segmentLength / this.ratioLtoS);
        var _segmentWidth = this.segmentLength / this.ratioLtoW;
        this._halfSegmentWidth = _segmentWidth / 2;
        this._segmentEndAngle = (Math.PI / 2 - this._angleRadian) / 2;
        this._segmentHorizontalShiftDistance = this._halfSegmentWidth * Math.tan(this._angleDegree >= 0 ? this._segmentEndAngle : Math.PI / 2 - this._segmentEndAngle); //This is the horizontal distance between the left most point in the digit and the nearest point on that same segment.
        this._height =
            _segmentWidth +
                2 * this.segmentLength * Math.cos(this._angleRadian) +
                2 * this._spacing * (Math.sin(this._segmentEndAngle) + Math.cos(this._segmentEndAngle)); //This is the sum of the vertical distance between the following (1st point of segment A and 1st point of segment F) and (4th point of segment F and 1st point of segment E) and (4th point of segment E and 1st point of segment D).
        this._width =
            2 * this.segmentLength * Math.sin(Math.abs(this._angleRadian)) +
                2 * this._spacing * Math.cos(this._angleDegree >= 0 ? this._segmentEndAngle : Math.PI / 2 - this._segmentEndAngle) +
                this.segmentLength +
                2 * this._segmentHorizontalShiftDistance; //This is the horizontal distance between the outer most (furthest to the left or furthest to the right) point on the 2 outer most segments and the 1st or 4th (whichever is closest) point on that same segment.
        var h = this._halfSegmentWidth;
        var l = this.segmentLength;
        var t = Math.tan(this._segmentEndAngle); //tangent of the segmentEndAngle, used for several point locations
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
        //set vertical segment to horizontal segment mirrored over x axis
        for (var i = 0, hPoint = void 0, vPoint = void 0; (hPoint = this._horizontalSegmentGeometry[i]) && (vPoint = this._verticalSegmentGeometry[i]); ++i) {
            vPoint.x = hPoint.x;
            vPoint.y = -hPoint.y;
        }
        //rotate vertical segment, https://en.wikipedia.org/wiki/Cartesian_coordinate_system#Rotation
        var angle = this._angleRadian + Math.PI / 2; //rotate by 90deg + _angleDeg for proper position
        for (var _i = 0, _a = this._verticalSegmentGeometry; _i < _a.length; _i++) {
            var p = _a[_i];
            var tempX = p.x;
            var tempY = p.y;
            p.x = tempX * Math.cos(angle) - tempY * Math.sin(angle);
            p.y = tempX * Math.sin(angle) + tempY * Math.cos(angle);
        }
    };
    /**
     * This method first calls _calculateSegmentGeometry to populate the horizontal and vertical geometry arrays.
     * Then, the x and y translations for each segment are calculated.
     * Finally, the translations are applied to each segment.
     *
     * @private
     */
    Seven.prototype._positionSegments = function () {
        this._checkConfig();
        this._calculateSegmentGeometry();
        var l = this.segmentLength;
        var aC = this._spacing * Math.cos(this._segmentEndAngle); //Used for horizontal spacing calculations
        var aS = this._spacing * Math.sin(this._segmentEndAngle); //Used for horizontal spacing calculations
        var x = this._translations;
        //calculate the x translations
        x[6].x = this._segmentHorizontalShiftDistance + l * Math.sin(Math.abs(this._angleRadian)) + (this._angleDegree >= 0 ? aC : aS);
        x[5].x = x[6].x - aS + l * Math.sin(this._angleRadian);
        x[0].x = x[5].x + aC;
        x[1].x = x[6].x + l + aC + l * Math.sin(this._angleRadian);
        x[2].x = x[6].x + l + aS;
        x[3].x = x[6].x + (aS - aC) - l * Math.sin(this._angleRadian);
        x[4].x = x[4].x = x[6].x - aC;
        //calculate the y translations
        x[0].y = this._halfSegmentWidth;
        x[1].y = x[0].y + aC;
        x[5].y = x[0].y + aS;
        x[6].y = x[5].y + l * Math.cos(this._angleRadian) + aC;
        x[2].y = x[6].y + aC;
        x[4].y = x[6].y + aS;
        x[3].y = x[4].y + l * Math.cos(this._angleRadian) + aC;
        //update all segment positions
        for (var i = 0, s = void 0, t = void 0; (s = this.segments[i]) && (t = x[i]); ++i) {
            for (var j = 0, p = void 0, g = void 0; (p = s.points[j]) && (g = t.a[j]); ++j) {
                p.x = g.x + t.x;
                p.y = g.y + t.y;
            }
        }
    };
    Seven.prototype._set = function (prop, value) {
        var oldValue = this[prop];
        try {
            this[prop] = value;
            this._positionSegments();
        }
        catch (e) {
            this[prop] = oldValue;
            this._positionSegments();
            throw e;
        }
    };
    Object.defineProperty(Seven.prototype, "angle", {
        get: function () {
            return this._angleDegree;
        },
        set: function (value) {
            this._set('_angleDegree', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Seven.prototype, "segmentLength", {
        get: function () {
            return this._segmentLength;
        },
        set: function (value) {
            this._set('_segmentLength', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Seven.prototype, "ratioLtoW", {
        get: function () {
            return this._ratioLtoW;
        },
        set: function (value) {
            this._set('_ratioLtoW', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Seven.prototype, "ratioLtoS", {
        get: function () {
            return this._ratioLtoS;
        },
        set: function (value) {
            this._set('_ratioLtoS', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Seven.prototype, "digit", {
        get: function () {
            return this._digit;
        },
        set: function (value) {
            //Check digit
            var newValue = value * 1; //convert to a number
            if (newValue != value || (typeof value === 'string' && value.toString().trim() === '')) {
                throw new TypeError("Invalid value (" + value + ") for digit, not a Digit.");
            }
            else if (Digit[newValue] === undefined) {
                throw new RangeError("Invalid value (" + newValue + ") for digit, must be a Digit.");
            }
            this._digit = newValue;
            //Set segment's on/off as needed
            for (var i = 0, s = void 0; s = this.segments[i]; ++i) {
                s.on = Seven.matrix[this._digit][i];
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Seven.prototype, "height", {
        get: function () {
            return this._height;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Seven.prototype, "width", {
        get: function () {
            return this._width;
        },
        enumerable: true,
        configurable: true
    });
    Seven.matrix = [
        //A     B      C      D      E      F      G
        [true, true, true, true, true, true, false],
        [false, true, true, false, false, false, false],
        [true, true, false, true, true, false, true],
        [true, true, true, true, false, false, true],
        [false, true, true, false, false, true, true],
        [true, false, true, true, false, true, true],
        [true, false, true, true, true, true, true],
        [true, true, true, false, false, false, false],
        [true, true, true, true, true, true, true],
        [true, true, true, true, false, true, true],
        [false, false, false, false, false, false, false],
        [false, true, true, true, true, false, true],
    ];
    return Seven;
})();
exports.Seven = Seven;
