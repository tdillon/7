export interface Point {
  x:number;
  y:number;
}


export interface SevenConfig {
  height?:number;
  width?:number;
  angle?:number;
  ratioLtoW?:number;
  ratioLtoS?:number;
  digit?:Digit;
}


interface TranslationsConfig {
  x: number;
  y: number;
  a: Array<Point>;
}


export enum Digit { ZERO = 0, ONE = 1, TWO = 2, THREE = 3, FOUR = 4, FIVE = 5, SIX = 6, SEVEN = 7, EIGHT = 8, NINE = 9, BLANK = 10, D = 11 }


export class Segment {
  on:boolean = false;

  points:Array<Point> = [
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0}
  ];

  get off() {
    return !this.on;
  }
}


/**
 * The Seven class represents the geometry of a seven segment digit.
 * The geometry uses a coordinate system that is a cartesian grid with
 *    -x values to the left of the origin,
 *    +x values to the right of the origin,
 *    +y values below the origin, and
 *    -y values above the origin.
 * This is the coordinate system typically used for computer graphic systems.
 */
export class Seven {
  /** Lookup between which segments are used for each digit.  */
  private static matrix = [
    //A     B      C      D      E      F      G
    [true, true, true, true, true, true, false],  //0
    [false, true, true, false, false, false, false],  //1
    [true, true, false, true, true, false, true],  //2
    [true, true, true, true, false, false, true],  //3
    [false, true, true, false, false, true, true],  //4
    [true, false, true, true, false, true, true],  //5
    [true, false, true, true, true, true, true],  //6
    [true, true, true, false, false, false, false],  //7
    [true, true, true, true, true, true, true],  //8
    [true, true, true, true, false, true, true],  //9
    [false, false, false, false, false, false, false],  //BLANK
    [false, true, true, true, true, false, true],  //d
  ];
  /** The cononical points for a horizontal segment for the given configuration. */
  private _horizontalSegmentGeometry:Array<Point> = [
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0}
  ];
  /** The cononical points for a vertical segment for the given configuration. */
  private _verticalSegmentGeometry:Array<Point> = [
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0}
  ];
  /** The x and y shifts that must be applied to each segment. */
  private _translations:Array<TranslationsConfig> = [
    {x: 0, y: 0, a: this._horizontalSegmentGeometry},
    {x: 0, y: 0, a: this._verticalSegmentGeometry},
    {x: 0, y: 0, a: this._verticalSegmentGeometry},
    {x: 0, y: 0, a: this._horizontalSegmentGeometry},
    {x: 0, y: 0, a: this._verticalSegmentGeometry},
    {x: 0, y: 0, a: this._verticalSegmentGeometry},
    {x: 0, y: 0, a: this._horizontalSegmentGeometry}
  ];

  /** The segments, A-G of the digit. */
  public segments:Array<Segment> = [new Segment(), new Segment(), new Segment(), new Segment(), new Segment(), new Segment(), new Segment()];

  //THESE ARE FOR PUBLIC GETTERS/SETTERS

  /** This is the angle (in degrees) that the digit is from vertical.  + values mean angled to the right, - values mean angled to the left */
  private _angleDegree:number;
  /** This is the ratio between the length of a segment and it's width. */
  private _ratioLtoW:number;
  /** This is the ratio between the length of a segment and the space between 2 segments. */
  private _ratioLtoS:number;
  /** The overall height of the digit. */
  private _height:number;
  /**  The 'digit' (e.g., 1, 2, blank) for which the segments will be set to on/off. */
  private _digit;

  //THESE ARE FOR PUBLIC GETTERS

  /** The overall width of the digit. */
  private _width:number;

  //THESE ARE USED TO EITHER CALCULATE THE HORIZONTAL OR VERTICAL SEGMENT GEOMETRY, OR THE SEGMENT POSITIONS.

  /** This is the length of each segment in the digit (distance between 1st and 4th points). */
  private _segmentLength:number;
  /** This is the angle between the first 2 points in the _horizontalSegmentGeometry array and the x axis. */
  private _segmentEndAngle:number;
  /** This is the horizontal distance between the outer most (furthest to the left or furthest to the right) point on the 2 outer most segments and the 1st or 4th (whichever is closest) point on that same segment. */
  private _segmentHorizontalShiftDistance:number;
  /** This is the _angleDegree expressed in radians. */
  private _angleRadian:number;
  /** This is the distance between 2 adjacent segments. */
  private _spacing:number;
  /** This is half of the segment's width. */
  private _halfSegmentWidth:number;
  /** When true heigt is fixed, when false, width is fixed. */
  private _isHeightFixed:boolean;


  /**
   * Construct a new Seven object.
   * Optionally pass a SevenConfig object to set properties.
   * Each property of the SevenConfig object is optional.
   * If the passed in config contains bad values an exception will be thrown.
   */
  constructor({height, width, angle = 10, ratioLtoW = 4, ratioLtoS = 32, digit = Digit.BLANK}: SevenConfig = {}) {
    this._angleDegree = angle;
    this.digit = digit;
    this._ratioLtoW = ratioLtoW;
    this._ratioLtoS = ratioLtoS;
    this._height = this._width = 100;  //initialize so checkConfig passes, and for default case
    this._isHeightFixed = true;

    if (height !== undefined) {  //height was specified
      this._height = height;
    } else if( width !== undefined){  //width specified
      this._width = width;
      this._isHeightFixed = false;
    }  //else - neither specified, default to height=100

    this._positionSegments();
  }

  /**
   * Check the height, width, angle, ratioLtoH, and ratioLtoS for valid values.
   * Throws exception on first found issue.
   *
   * @private
   */
  private _checkConfig() {
    let a;
    let b;

    //check height
    a = this._height;
    b = a * 1;  //convert to a number
    if (b != a || (typeof a === 'string' && a.toString().trim() === '')) {  //Check for cases when nonnumeric string, spaces, or empty strings are used.
      throw new TypeError(`Invalid value (${a}) for height, not a number.`);
    } else if (b <= 0) {
      throw new RangeError(`Invalid value (${b}) for height, must be greater than 0.`);
    } else if (!isFinite(b)) {
      throw new RangeError(`Invalid value (${b}) for height, must be finite.`);
    }
    this._height = b;

      //check width
      a = this._width;
      b = a * 1;  //convert to a number
      if (b != a || (typeof a === 'string' && a.toString().trim() === '')) {  //Check for cases when nonnumeric string, spaces, or empty strings are used.
        throw new TypeError(`Invalid value (${a}) for width, not a number.`);
      } else if (b <= 0) {
        throw new RangeError(`Invalid value (${b}) for width, must be greater than 0.`);
      } else if (!isFinite(b)) {
        throw new RangeError(`Invalid value (${b}) for width, must be finite.`);
      }
      this._width = b;

    //Check angle
    a = this._angleDegree;
    b = a * 1;  //convert to a number
    if (b != a || (typeof a === 'string' && a.toString().trim() === '')) {  //Check for cases when nonnumeric string, spaces, or empty strings are used.
      throw new TypeError(`Invalid value (${a}) for angle, not a number.`);
    } else if (b <= -90 || b >= 90) {
      throw new RangeError(`Invalid value (${b}) for angle, must be between 90 and -90 degrees.`);
    }
    this._angleDegree = b;

    //Check ratioLtoW
    a = this._ratioLtoW;
    b = a * 1;  //convert to a number
    if (b != a || (typeof a === 'string' && a.toString().trim() === '')) {  //Check for cases when nonnumeric string, spaces, or empty strings are used.
      throw new TypeError(`Invalid value (${a}) for ratioLtoW, not a number.`);
    } else if (b < 1) {
      throw new RangeError(`Invalid value (${b}) for ratioLtoW, must be at least 1.`);
    } else if (!isFinite(b)) {
      throw new RangeError(`Invalid value (${b}) for ratioLtoW, must be finite.`);
    }
    this._ratioLtoW = b;

    //Check ratioLtoS
    a = this._ratioLtoS;
    b = a * 1;  //convert to a number
    if (b != a || (typeof a === 'string' && a.toString().trim() === '')) {  //Check for cases when null, undefined, object, nonnumeric string, spaces, or empty strings are used.
      throw new TypeError(`Invalid value (${a}) for ratioLtoS, not a number.`);
    } else if (b <= 0) {
      throw new RangeError(`Invalid value (${b}) for ratioLtoS, must be greater than 0.`);
    } else if (!isFinite(b)) {
      throw new RangeError(`Invalid value (${b}) for ratioLtoS, must be finite.`);
    }
    this._ratioLtoS = b;
  }

  /**
   * This method sets the following values for the object.
   * _segmentLength, _angleRadian, _spacing, _halfSegmentWidth, _height, _width
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
  private _calculateSegmentGeometry() {
    this._angleRadian = this._angleDegree * Math.PI / 180;
    this._segmentEndAngle = (Math.PI / 2 - this._angleRadian) / 2;

    //These calculations for segmentLength are the same as the height and width calcs below, except solved for segmentLength;
    if (this._isHeightFixed) {  //HEIGHT IS FIXED
      this._segmentLength = this._height / (1 / this._ratioLtoW + 2 * Math.cos(this._angleRadian) + 2 * (Math.sin(this._segmentEndAngle) + Math.cos(this._segmentEndAngle)) / this._ratioLtoS);
    } else {  //WIDTH IS FIXED
      this._segmentLength = this._width / (2 * Math.sin(Math.abs(this._angleRadian)) + 2 * Math.cos(this._angleDegree >= 0 ? this._segmentEndAngle : Math.PI / 2 - this._segmentEndAngle) / this._ratioLtoS + 1 + Math.tan(this._angleDegree >= 0 ? this._segmentEndAngle : Math.PI / 2 - this._segmentEndAngle) / this._ratioLtoW);
    }

    this._spacing = this._segmentLength / this.ratioLtoS;
    const _segmentWidth = this._segmentLength / this.ratioLtoW;
    this._halfSegmentWidth = _segmentWidth / 2;
    this._segmentHorizontalShiftDistance = this._halfSegmentWidth * Math.tan(this._angleDegree >= 0 ? this._segmentEndAngle : Math.PI / 2 - this._segmentEndAngle);  //This is the horizontal distance between the left most point in the digit and the nearest point on that same segment.

    if (this._isHeightFixed) {
      this._width =
        2 * this._segmentLength * Math.sin(Math.abs(this._angleRadian)) +  //This is the horizontal distance between the 1st and 4th points in the two segments that constitute the widest portion of the digit (i.e., B & E when angle >= 0 and C & F when angle < 0).
        2 * this._spacing * Math.cos(this._angleDegree >= 0 ? this._segmentEndAngle : Math.PI / 2 - this._segmentEndAngle) +  //This is the horizontal distance between the 1st and 4th points of the G block and the nearest 2 points described above.
        this._segmentLength +  //This is the horizontal distance of the G segment.
        2 * this._segmentHorizontalShiftDistance;  //This is the horizontal distance between the outer most (furthest to the left or furthest to the right) point on the 2 outer most segments and the 1st or 4th (whichever is closest) point on that same segment.
    } else {
      this._height =
        _segmentWidth +  //This is the vertical distance between the first points in the A and D segments and the top and bottom of the digit respectively.
        2 * this._segmentLength * Math.cos(this._angleRadian) +  //This is the sum of the vertical distance between the 1st and 4th points of the A and B segments.
        2 * this._spacing * (Math.sin(this._segmentEndAngle) + Math.cos(this._segmentEndAngle));  //This is the sum of the vertical distance between the following (1st point of segment A and 1st point of segment F) and (4th point of segment F and 1st point of segment E) and (4th point of segment E and 1st point of segment D).
    }

    const h = this._halfSegmentWidth;
    const l = this._segmentLength;
    const t = Math.tan(this._segmentEndAngle);  //tangent of the segmentEndAngle, used for several point locations

    this._horizontalSegmentGeometry[1].x = h / t;
    this._horizontalSegmentGeometry[1].y = this._horizontalSegmentGeometry[2].y = -h;
    this._horizontalSegmentGeometry[2].x = l - h * t;
    this._horizontalSegmentGeometry[3].x = l;
    this._horizontalSegmentGeometry[4].x = l - h / t;
    this._horizontalSegmentGeometry[4].y = this._horizontalSegmentGeometry[5].y = h;
    this._horizontalSegmentGeometry[5].x = h * t;

    if (this._horizontalSegmentGeometry[1].x > this._horizontalSegmentGeometry[2].x) {
      throw new RangeError(`This digit configuration produces invalid geometry.  angle: ${this._angleDegree},   ratioLtoW: ${this._ratioLtoW},   ratioLtoS: ${this._ratioLtoS}`);
    }

    //set vertical segment to horizontal segment mirrored over x axis
    for (let i = 0, hPoint, vPoint; (hPoint = this._horizontalSegmentGeometry[i]) && (vPoint = this._verticalSegmentGeometry[i]); ++i) {
      vPoint.x = hPoint.x;
      vPoint.y = -hPoint.y;
    }

    //rotate vertical segment, https://en.wikipedia.org/wiki/Cartesian_coordinate_system#Rotation
    const angle = this._angleRadian + Math.PI / 2;  //rotate by 90deg + _angleDeg for proper position
    for (let p of this._verticalSegmentGeometry) {
      const tempX = p.x;
      const tempY = p.y;
      p.x = tempX * Math.cos(angle) - tempY * Math.sin(angle);
      p.y = tempX * Math.sin(angle) + tempY * Math.cos(angle);
    }
  }

  /**
   * This method first calls _calculateSegmentGeometry to populate the horizontal and vertical geometry arrays.
   * Then, the x and y translations for each segment are calculated.
   * Finally, the translations are applied to each segment.
   *
   * @private
   */
  private _positionSegments() {
    this._checkConfig();
    this._calculateSegmentGeometry();

    const l = this._segmentLength;
    const aC = this._spacing * Math.cos(this._segmentEndAngle);  //Used for horizontal spacing calculations
    const aS = this._spacing * Math.sin(this._segmentEndAngle);  //Used for horizontal spacing calculations
    const x = this._translations;

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
    for (let i = 0, s, t; (s = this.segments[i]) && (t = x[i]); ++i) {
      for (let j = 0, p, g; (p = s.points[j]) && (g = t.a[j]); ++j) {
        p.x = g.x + t.x;
        p.y = g.y + t.y;
      }
    }
  }

  private _set(prop:string, value:any):void {
    let oldValue = this[prop];

    try {
      this[prop] = value;
      this._positionSegments();
    } catch (e) {
      this[prop] = oldValue;
      this._positionSegments();
      throw e;
    }
  }

  get angle() {
    return this._angleDegree;
  }

  set angle(value) {
    this._set('_angleDegree', value);
  }

  get ratioLtoW() {
    return this._ratioLtoW;
  }

  set ratioLtoW(value) {
    this._set('_ratioLtoW', value);
  }

  get ratioLtoS() {
    return this._ratioLtoS;
  }

  set ratioLtoS(value) {
    this._set('_ratioLtoS', value);
  }

  get digit():Digit {
    return this._digit;
  }

  set digit(value:Digit) {
    //Check digit
    let newValue = value * 1;  //convert to a number
    if (newValue != value || (typeof value === 'string' && value.toString().trim() === '')) {  //Check for cases when nonnumeric string, spaces, or empty strings are used.
      throw new TypeError(`Invalid value (${value}) for digit, not a Digit.`);
    } else if (Digit[newValue] === undefined) {
      throw new RangeError(`Invalid value (${newValue}) for digit, must be a Digit.`);
    }
    this._digit = newValue;

    //Set segment's on/off as needed
    for (let i = 0, s; s = this.segments[i]; ++i) {
      s.on = Seven.matrix[this._digit][i];
    }
  }

  get height() {
    return this._height;
  }

  set height(value) {
    const orig = this._isHeightFixed;
    this._isHeightFixed = true;
    try {
      this._set('_height', value);
    } catch (e) {
      this._isHeightFixed = orig;
      throw e;
    }
  }

  get width() {
    return this._width;
  }

  set width(value) {
    const orig = this._isHeightFixed;
    this._isHeightFixed = false;
    try {
      this._set('_width', value);
    } catch (e) {
      this._isHeightFixed = orig;
      throw e;
    }
  }
}
