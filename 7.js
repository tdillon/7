class Segment {
  constructor(type, points) {
    this.points = points;
    this.type = type;
  }

  static get Type() {
    return { A:'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F', G: 'G' };
  }
}

export class Seven {

  constructor({SegmentLength = 100, Angle = 10, RatioLtoH = 4, RatioLtoS = 32, Value = 7} = {}) {
    console.log('constructor');
    this._angle = Angle;

      this.value = Value;
      this.segmentLength = SegmentLength;
      this.ratioLtoH = RatioLtoH;
      this.ratioLtoS = RatioLtoS;
      this.inactiveColor = "hsla(0,100%,0%,.1)";
      this.activeColor = "hsl(0,100%,0%)";

    this.segments =  this.getDigit();

    this.matrix = [
      //A     B      C      D      E      F      G
      [true , true , true , true , true , true , false],  //0
      [false, true , true , false, false, false, false],  //1
      [true , true , false, true , true , false, true ],  //2
      [true , true , true , true , false, false, true ],  //3
      [false, true , true , false, false, true , true ],  //4
      [true , false, true , true , false, true , true ],  //5
      [true , false, true , true , true , true , true ],  //6
      [true , true , true , false, false, false, false],  //7
      [true , true , true , true , true , true , true ],  //8
      [true , true , true , true , false, true , true ],  //9
      [false, false, false, false, false, false, false],  //BLANK
      [false, true , true , true , true , false, true ],  //d
    ];

  }

  set angle (value) {
    console.log(`angle(${value})`);
    this._angle = value;  //TODO check for invalid range i.e. -90 < value < 90


        this.segments =  this.getDigit();
  }

  get angle () { return this._angle; }


    getHorizontal(xOffset, yOffset) {

      var h = this.segmentWidth;
      var l = this.segmentLength;
      var angle = Math.atan(Math.cos(this.angleRad) / (1 + Math.sin(this.angleRad)));

      return [
        {x: xOffset,                               y: yOffset},
        {x: h / 2 / Math.tan(angle) + xOffset,     y: -h / 2 + yOffset},
        {x: l - h / 2 * Math.tan(angle) + xOffset, y: -h / 2 + yOffset},
        {x: l + xOffset,                           y: 0 + yOffset},
        {x: l - h / 2 / Math.tan(angle) + xOffset, y: h / 2 + yOffset},
        {x: h / 2 * Math.tan(angle) + xOffset,     y: h / 2 + yOffset}
      ];
    }

    getVertical(xOffset, yOffset) {
      var h = this.segmentWidth;
      var l = this.segmentLength;
      var angle = Math.atan(Math.cos(this.angleRad) / (1 + Math.sin(this.angleRad)));
      var angleRad = this.angleRad;
      var halfWidth = this.halfWidth;

      var vPoints = [
        {x: 0, y: 0},
        {x: ((h / 2) * Math.tan(angle)), y: -h / 2},
        {x: (l - (h / 2) / Math.tan(angle)), y: -h / 2},
        {x: l, y: 0},
        {x: (l - (h / 2) * Math.tan(angle)), y: h / 2},
        {x: ((h / 2) / Math.tan(angle)), y: h / 2},
      ];

      for (var i = 0,point = vPoints[0]; i < vPoints.length; point = vPoints[++i]) {
        var tempX = point.x;
        var tempY = point.y;
        point.x = tempX * Math.cos(angleRad + Math.PI / 2) - tempY * Math.sin(angleRad + Math.PI / 2) + xOffset;
        point.y = tempX * Math.sin(angleRad + Math.PI / 2) + tempY * Math.cos(angleRad + Math.PI / 2) + yOffset;
      }

      return vPoints;
    }

    getDigit() {
      var angleDeg = this.angle;
      var l = this.segmentLength;
      var halfWidth = this.halfWidth;
      var spacing = this.spacing;
      var angleRad = angleDeg * Math.PI / 180;
      var angle = Math.atan(Math.cos(angleRad) / (1 + Math.sin(angleRad)));

      var xshift = halfWidth + spacing * Math.cos(angle) + 1;
      var yshift = halfWidth + spacing * (Math.sin(angle) + Math.cos(angle)) + 1;

      var axtrans = xshift     + 2 * l * Math.sin(angleRad) + spacing * (Math.cos(angle) - Math.sin(angle)) ;
      var bxtrans = xshift + l + 2 * l * Math.sin(angleRad) + spacing * Math.cos(angle)                     ;
      var cstrans = xshift + l     + l * Math.sin(angleRad) + spacing * Math.sin(angle)
      var dxtrans = xshift                                  - spacing * (Math.cos(angle) - Math.sin(angle)) ;
      var extrans = xshift         + l * Math.sin(angleRad) - spacing * Math.cos(angle);
      var fxtrans = xshift     + 2 * l * Math.sin(angleRad) - spacing * Math.sin(angle);
      var gxtrans = xshift         + l * Math.sin(angleRad);

      var aytrans = yshift                              - spacing * (Math.sin(angle) + Math.cos(angle));
      var bytrans = yshift                              - spacing * Math.sin(angle);
      var cytrans = yshift +     l * Math.cos(angleRad) + spacing * Math.cos(angle);
      var dytrans = yshift + 2 * l * Math.cos(angleRad) + spacing * (Math.sin(angle) + Math.cos(angle));
      var eytrans = yshift +     l * Math.cos(angleRad) + spacing * Math.sin(angle);
      var fytrans = yshift                              - spacing * Math.cos(angle);
      var gytrans = yshift +     l * Math.cos(angleRad);

      return [
        new Segment(Segment.Type.A, this.getHorizontal(axtrans, aytrans)),
        new Segment(Segment.Type.B, this.getVertical(bxtrans, bytrans)),
        new Segment(Segment.Type.C, this.getVertical(cstrans, cytrans)),
        new Segment(Segment.Type.D, this.getHorizontal(dxtrans, dytrans)),
        new Segment(Segment.Type.E, this.getVertical(extrans, eytrans)),
        new Segment(Segment.Type.F, this.getVertical(fxtrans, fytrans)),
        new Segment(Segment.Type.G, this.getHorizontal(gxtrans, gytrans))
      ];
    }

    on(segment) {
      return this.matrix[this.value][segment.type.charCodeAt(0) - 65];  //TODO use an enum or something
    }

      get angleRad() {
        return this.angle * Math.PI / 180;
      }

      get segmentEndAngle() {
        return Math.atan(Math.cos(this.angleRad) / (1 + Math.sin(this.angleRad)));
      }

      get height() {
        return this.segmentWidth + 2 * this.segmentLength * Math.cos(this.angleRad) + this.spacing * (Math.sin(this.segmentEndAngle) + Math.cos(this.segmentEndAngle))  + this.spacing * (Math.sin(this.segmentEndAngle) + Math.cos(this.segmentEndAngle)) + 3;
      }

      get width() {
        return this.segmentWidth + this.segmentLength + 2 * this.segmentLength * Math.sin(this.angleRad) + this.spacing * Math.cos(this.segmentEndAngle) + this.spacing * Math.cos(this.segmentEndAngle) + 3;
      }

      get segmentWidth() {
        return this.segmentLength / this.ratioLtoH;
      }

      get halfWidth() {
        return this.segmentWidth / 2;
      }

      get spacing() {
        return this.ratioLtoS === 0 ? 0 : this.segmentLength / this.ratioLtoS;
      }

    static get BLANK()  { return 10; }
    static get D() { return 11; }
}
