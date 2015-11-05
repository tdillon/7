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

  //these are for public getters/setters
  //TODO explain each of these as needed
  private _angleDegree:number;
  private _ratioLtoW:number;
  private _ratioLtoS:number;
  private _segmentLength:number;
  private _segmentHorizontalShiftDistance:number;

  //these are for public getters
  //TODO explain each of these as needed
  private _height:number;
  private _width:number;

  //TODO explain each of these as needed
  private _angleRadian:number;
  private _spacing:number;
  private _halfWidth:number;
  segments:Array<Segment> = [
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
   * _angleRadian, _spacing, _halfWidth, _height, _width
   *
   * This method populates the _horizontalSegmentGeometry array.
   * The array contains the six points of the horizontal segment's geometry.
   * The first element in the array is the left most point.
   * The points are then listed in clockwise order.
   * The first point is always at the origin (0,0).
   * The fourth point is always at (l, 0). where l is the segment length
   *
   * This method populates the _verticalSegmentGeometry array.
   * The array contains the six points of the vertical segment's geometry.
   * The first element in the array is the top most point.
   * The points are then listed in clockwise order.
   * The first point is always at the origin (0,0).
   * The fourth point is always at (0, l). where l is the segment length
   *
   * This method throws an error if the calculated geometry is unexpected.
   *
   * @private
   */
  private _calculateSegmentGeometry() {
    this._angleRadian = this._angleDegree * Math.PI / 180;
    this._spacing = (this.ratioLtoS === 0 ? 0 : this.segmentLength / this.ratioLtoS);
    const _segmentWidth = this.segmentLength / this.ratioLtoW;
    this._halfWidth = _segmentWidth / 2;
    const segmentEndAngle = Math.atan(Math.cos(this._angleRadian) / (1 + Math.sin(this._angleRadian))); //TODO what angle is this?, i believe this is the 90deg - the angle between the first 2 points in the _horizontalSegmentGeometry array and the x axis.  TODO think of a cleaner way to say that.
    this._segmentHorizontalShiftDistance = ((this._halfWidth / Math.sin(Math.PI / 2 - segmentEndAngle)) * Math.sin((Math.PI / 2 - segmentEndAngle) - this._angleRadian));  //TODO explain this mess
    //TODO explain height calculation, line by line
    this._height = _segmentWidth +
      2 * this.segmentLength * Math.cos(this._angleRadian) +
      2 * this._spacing * (Math.sin(segmentEndAngle) + Math.cos(segmentEndAngle));
    //TODO explain width calculation, line by line
    this._width = //TODO width number don't appear correct for negative values, probably _segmentHorizontalShiftDistance needs cos instead of sin
      2 * this._segmentHorizontalShiftDistance +
      this.segmentLength +
      2 * this.segmentLength * Math.sin(Math.abs(this._angleRadian)) +  //TODO use Math.abs for negative angle, make sure that is correct
      2 * this._spacing * Math.cos(segmentEndAngle);


    var h = _segmentWidth;
    var l = this.segmentLength;
    var angle = Math.cos(this._angleRadian) / (1 + Math.sin(this._angleRadian));  //TODO: what angle is this?

    this._horizontalSegmentGeometry[1].x = h / 2 / angle;
    this._horizontalSegmentGeometry[1].y = this._horizontalSegmentGeometry[2].y = -h / 2;
    this._horizontalSegmentGeometry[2].x = l - h / 2 * angle;
    this._horizontalSegmentGeometry[3].x = l;
    this._horizontalSegmentGeometry[4].x = l - h / 2 / angle;
    this._horizontalSegmentGeometry[4].y = this._horizontalSegmentGeometry[5].y = h / 2;
    this._horizontalSegmentGeometry[5].x = h / 2 * angle;

    if (this._horizontalSegmentGeometry[1].x > this._horizontalSegmentGeometry[2].x) {
      throw "TODO values out of whack";
    }

    //set vertical segment to horizontal segment mirrored over x axis
    for (let i = 0, hPoint, vPoint; (hPoint = this._horizontalSegmentGeometry[i]) && (vPoint = this._verticalSegmentGeometry[i]); ++i) {
      vPoint.x = hPoint.x;
      vPoint.y = -hPoint.y;
    }

    //rotate vertical segment
    const angleFoo = this._angleRadian + Math.PI / 2;  //TODO rename, angleRad + 180 degrees.
    for (let p of this._verticalSegmentGeometry) {
      const tempX = p.x;
      const tempY = p.y;
      p.x = tempX * Math.cos(angleFoo) - tempY * Math.sin(angleFoo);
      p.y = tempX * Math.sin(angleFoo) + tempY * Math.cos(angleFoo);
    }
  }

  /**
   * TODO explain the positioning of the segments
   * TODO clean up this method, look for performance and readablity improvements
   * Segments are A, D, & G.
   * @private
   */
  private _positionSegments() {
    this._calculateSegmentGeometry();

    var l = this.segmentLength;
    var halfWidth = this._halfWidth;
    var spacing = this._spacing;
    var angle = Math.atan(Math.cos(this._angleRadian) / (1 + Math.sin(this._angleRadian)));

    var xshift = this._segmentHorizontalShiftDistance + spacing * Math.cos(angle) + 1 * 0;
    var yshift = halfWidth + spacing * (Math.sin(angle) + Math.cos(angle)) + 1 * 0;

    var axtrans = xshift + 2 * l * Math.sin(this._angleRadian) + spacing * (Math.cos(angle) - Math.sin(angle));
    var bxtrans = xshift + l + 2 * l * Math.sin(this._angleRadian) + spacing * Math.cos(angle);
    var cstrans = xshift + l + l * Math.sin(this._angleRadian) + spacing * Math.sin(angle);
    var dxtrans = xshift - spacing * (Math.cos(angle) - Math.sin(angle));
    var extrans = xshift + l * Math.sin(this._angleRadian) - spacing * Math.cos(angle);
    var fxtrans = xshift + 2 * l * Math.sin(this._angleRadian) - spacing * Math.sin(angle);
    var gxtrans = xshift + l * Math.sin(this._angleRadian);

    var aytrans = yshift - spacing * (Math.sin(angle) + Math.cos(angle));
    var bytrans = yshift - spacing * Math.sin(angle);
    var cytrans = yshift + l * Math.cos(this._angleRadian) + spacing * Math.cos(angle);
    var dytrans = yshift + 2 * l * Math.cos(this._angleRadian) + spacing * (Math.sin(angle) + Math.cos(angle));
    var eytrans = yshift + l * Math.cos(this._angleRadian) + spacing * Math.sin(angle);
    var fytrans = yshift - spacing * Math.cos(angle);
    var gytrans = yshift + l * Math.cos(this._angleRadian);


    //HORIZONTAL SEGMENTS
    for (let i = 0, a, g; (a = this.segments[0].points[i]) && (g = this._horizontalSegmentGeometry[i]); ++i) {
      a.x = g.x + axtrans;
      a.y = g.y + aytrans;
    }

    for (let i = 0, d, g; (d = this.segments[3].points[i]) && (g = this._horizontalSegmentGeometry[i]); ++i) {
      d.x = g.x + dxtrans;
      d.y = g.y + dytrans;
    }

    for (let i = 0, gh, g; (gh = this.segments[6].points[i]) && (g = this._horizontalSegmentGeometry[i]); ++i) {
      gh.x = g.x + gxtrans;
      gh.y = g.y + gytrans;
    }

    //VERTICAL SEGMENTS
    for (let i = 0, b, g; (b = this.segments[1].points[i]) && (g = this._verticalSegmentGeometry[i]); ++i) {
      b.x = g.x + bxtrans;
      b.y = g.y + bytrans;
    }
    for (let i = 0, c, g; (c = this.segments[2].points[i]) && (g = this._verticalSegmentGeometry[i]); ++i) {
      c.x = g.x + cstrans;
      c.y = g.y + cytrans;
    }
    for (let i = 0, e, g; (e = this.segments[4].points[i]) && (g = this._verticalSegmentGeometry[i]); ++i) {
      e.x = g.x + extrans;
      e.y = g.y + eytrans;
    }
    for (let i = 0, f, g; (f = this.segments[5].points[i]) && (g = this._verticalSegmentGeometry[i]); ++i) {
      f.x = g.x + fxtrans;
      f.y = g.y + fytrans;
    }

  }

  on(segment) {
    return this.matrix[this.value][segment.type.charCodeAt(0) - 65];  //TODO use an enum or something
  }

  get angle() {
    return this._angleDegree;
  }

  set angle(value) {
    let newValue = value * 1;  //TODO explain, convert value to a number
    if (newValue != value) {  //TODO this doesn't work in all cases, empty string, spaces, and infinity
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
