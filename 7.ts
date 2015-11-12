export interface Point {
  x:number;
  y:number;
}

export interface SevenConfig {
  SegmentLength?:number;
  Angle?:number;
  ratioLtoW?:number;
  RatioLtoS?:number;
  Value?:number;
}

export interface TranslationsConfig {
  x: number;
  y: number;
  a: Array<Point>;
}

export enum SegmentType { A, B, C, D, E, F, G }

export class Segment {
  points:Array<Point> = [
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0}
  ];

  constructor(public type:SegmentType) {
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
  private matrix;

  private _horizontalSegmentGeometry:Array<Point> = [
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0}
  ];

  private _verticalSegmentGeometry:Array<Point> = [
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0},
    {x: 0, y: 0}
  ];

  private _translations:Array<TranslationsConfig> = [
    {x: 0, y: 0, a: this._horizontalSegmentGeometry},
    {x: 0, y: 0, a: this._verticalSegmentGeometry},
    {x: 0, y: 0, a: this._verticalSegmentGeometry},
    {x: 0, y: 0, a: this._horizontalSegmentGeometry},
    {x: 0, y: 0, a: this._verticalSegmentGeometry},
    {x: 0, y: 0, a: this._verticalSegmentGeometry},
    {x: 0, y: 0, a: this._horizontalSegmentGeometry}
  ];
  
  //these are for public getters/setters
  private _angleDegree:number;  //This is the angle (in degrees) that the digit is from vertical.  + values mean angled to the right, - values mean angled to the left
  private _segmentLength:number;  //This is the length of each segment in the digit (distance between 1st and 4th points).
  private _ratioLtoW:number;  //This is the ratio between the length of a segment and it's width.
  private _ratioLtoS:number;  //This is the ratio between the length of a segment and the space between 2 segments.

  //these are for public getters
  private _height:number;  //The overall height of the digit.
  private _width:number;  //The overall width of the digit.

  //these are used to either calculate the horizontal or vertical segment geometry, or the segment positions.
  private _segmentEndAngle:number;  //This is the angle between the first 2 points in the _horizontalSegmentGeometry array and the x axis.
  private _segmentHorizontalShiftDistance:number;  //This is the horizontal distance between the outer most (furthest to the left or furthest to the right) point on the 2 outer most segments and the 1st or 4th (whichever is closest) point on that same segment.
  private _angleRadian:number;  //This is the _angleDegree expressed in radians.
  private _spacing:number;  //This is the distance between 2 adjacent segments.
  private _halfSegmentWidth:number;  //This is half of the segment's width.

  public segments:Array<Segment> = [
    new Segment(SegmentType.A),
    new Segment(SegmentType.B),
    new Segment(SegmentType.C),
    new Segment(SegmentType.D),
    new Segment(SegmentType.E),
    new Segment(SegmentType.F),
    new Segment(SegmentType.G)
  ];
  value;

  constructor({SegmentLength = 50, Angle = 10, ratioLtoW = 4, RatioLtoS = 32, Value = 7}: SevenConfig = {}) {
    //TODO object could be constructed with wacky values, handle for that.
    this._angleDegree = Angle;
    this.value = Value;
    this._segmentLength = SegmentLength;
    this._ratioLtoW = ratioLtoW;
    this._ratioLtoS = RatioLtoS;

    this._positionSegments();

    this.matrix = [
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

  }

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
  private _calculateSegmentGeometry() {
    this._angleRadian = this._angleDegree * Math.PI / 180;
    this._spacing = (this.ratioLtoS === 0 ? 0 : this.segmentLength / this.ratioLtoS);
    const _segmentWidth = this.segmentLength / this.ratioLtoW;
    this._halfSegmentWidth = _segmentWidth / 2;
    this._segmentEndAngle = (Math.PI / 2 - this._angleRadian) / 2;
    this._segmentHorizontalShiftDistance = this._halfSegmentWidth * Math.tan(this._angleDegree >= 0 ? this._segmentEndAngle : Math.PI / 2 - this._segmentEndAngle);  //This is the horizontal distance between the left most point in the digit and the nearest point on that same segment.

    this._height =
      _segmentWidth +  //This is the vertical distance between the first points in the A and D segments and the top and bottom of the digit respectively.
      2 * this.segmentLength * Math.cos(this._angleRadian) +  //This is the sum of the vertical distance between the 1st and 4th points of the A and B segments.
      2 * this._spacing * (Math.sin(this._segmentEndAngle) + Math.cos(this._segmentEndAngle));  //This is the sum of the vertical distance between the following (1st point of segment A and 1st point of segment F) and (4th point of segment F and 1st point of segment E) and (4th point of segment E and 1st point of segment D).

    this._width =
      2 * this.segmentLength * Math.sin(Math.abs(this._angleRadian)) +  //This is the horizontal distance between the 1st and 4th points in the two segments that constitute the widest portion of the digit (i.e., B & E when angle >= 0 and C & F when angle < 0).
      2 * this._spacing * Math.cos(this._angleDegree >= 0 ? this._segmentEndAngle : Math.PI / 2 - this._segmentEndAngle) +  //This is the horizontal distance between the 1st and 4th points of the G block and the nearest 2 points described above.
      this.segmentLength +  //This is the horizontal distance of the G segment.
      2 * this._segmentHorizontalShiftDistance;  //This is the horizontal distance between the outer most (furthest to the left or furthest to the right) point on the 2 outer most segments and the 1st or 4th (whichever is closest) point on that same segment.

    const h = this._halfSegmentWidth;
    const l = this.segmentLength;
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
    this._calculateSegmentGeometry();

    const l = this.segmentLength;
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
    x[5].y  = x[0].y + aS;
    x[6].y = x[5].y + l * Math.cos(this._angleRadian) + aC;
    x[2].y = x[6].y + aC;
    x[4].y = x[6].y + aS;
    x[3].y = x[4].y + l * Math.cos(this._angleRadian) + aC;

    //update all segment positions
    for (let i = 0, s, t; (s = this.segments[i]) && (t = x[i]); ++i){
      for (let j = 0, p, g; (p = s.points[j]) && (g = t.a[j]); ++j) {
        p.x = g.x + t.x;
        p.y = g.y + t.y;
      }
    }
  }

  on(segment) {
    return this.matrix[this.value][segment.type.charCodeAt(0) - 65];  //TODO use an enum or something
  }

  get angle() {
    return this._angleDegree;
  }

  set angle(value) {
    let newValue = value * 1;  //Attempt to convert to a number.
    if (newValue != value || (typeof value === 'string' && value.toString().trim() === '')) {  //Check for cases when nonnumberic string, spaces, or empty strings are used.
      throw new TypeError(`Invalid value (${value}) for angle, not a number.`);
    } else if (newValue <= -90 || newValue >= 90) {
      throw new RangeError(`Invalid value (${newValue}) for angle, must be between 90 and -90 degrees.`);
    }
    let oldValue = this._angleDegree;
    try {
      this._angleDegree = newValue;
      this._positionSegments();
    } catch (e) {
      this._angleDegree = oldValue;
      this._positionSegments();
      throw new RangeError(`Invalid value (${newValue}) for angle, TODO makes wacky geometry.`);
    }
  }

  get segmentLength() {
    return this._segmentLength;
  }

  set segmentLength(value) {
    let newValue = value * 1;  //TODO explain
    if (newValue != value) {
      throw new TypeError(`Invalid value (${value}) for segmentLength, not a number.`);
    }
    let oldValue = this._segmentLength;
    try {
      this._segmentLength = newValue;
      this._positionSegments();
    } catch (e) {
      this._segmentLength = oldValue;
      this._positionSegments();
      throw new RangeError(`Invalid value (${newValue}) for segmentLength, TODO makes wacky geometry.`);
    }
  }

  get ratioLtoW() {
    return this._ratioLtoW;
  }

  set ratioLtoW(value) {
    let newValue = value * 1;  //TODO explain
    if (newValue != value) {
      throw new TypeError(`Invalid value (${value}) for ratioLtoW, not a number.`);
    } else if (newValue < 1) {
      throw new RangeError(`Invalid value (${newValue}) for ratioLtoW, must be at least 1.`);
    }
    let oldValue = this._ratioLtoW;
    try {
      this._ratioLtoW = newValue;
      this._positionSegments();
    } catch (e) {
      this._ratioLtoW = oldValue;
      this._positionSegments();
      throw new RangeError(`Invalid value (${newValue}) for ratioLtoW, TODO makes wacky geometry.`);
    }
  }

  get ratioLtoS() {
    return this._ratioLtoS;
  }

  set ratioLtoS(value) {
    let newValue = value * 1;  //convert to number TODO explain
    if (newValue != value) {  //check that value is actually a 'number', could be a string  TODO explain
      throw new TypeError(`Invalid value (${value}) for ratioLtoS, not a number.`);
    } else if (newValue <= 0) {
      throw new RangeError(`Invalid value (${newValue}) for ratioLtoS, must be greater than 0.`);
    }
    let oldValue = this._ratioLtoS;
    try {
      this._ratioLtoS = newValue;
      this._positionSegments();
    } catch (e) {
      this._ratioLtoS = oldValue;
      this._positionSegments();
      throw new RangeError(`Invalid value (${newValue}) for ratioLtoS, TODO makes wacky geometry.`);
    }

    this._ratioLtoS = value;
    this._positionSegments();
  }

  get height() {
    return this._height;
  }

  get width() {
    return this._width;
  }

  static get BLANK() {
    return 10;
  }

  static get D() {
    return 11;
  }
}
