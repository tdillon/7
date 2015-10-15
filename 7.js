"use strict";



var SevenSegmentDigit = function(options) {

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

  this.getHorizontal = function (xOffset, yOffset) {
    
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

  this.getVertical = function( xOffset, yOffset) {
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

  this.getDigit = function() {
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
      this.getHorizontal(axtrans, aytrans),
      this.getVertical(bxtrans, bytrans),
      this.getVertical(cstrans, cytrans),
      this.getHorizontal(dxtrans, dytrans),
      this.getVertical(extrans, eytrans),
      this.getVertical(fxtrans, fytrans),
      this.getHorizontal(gxtrans, gytrans)
    ];
  }

  var opts = options || { SegmentLength: 100, Angle: 10, RatioLtoH: 4, RatioLtoS: 32 };

  this.value = 7;
  this.segmentLength = opts.SegmentLength;
  this.angle = opts.Angle;
  this.ratioLtoH = opts.RatioLtoH;
  this.ratioLtoS = opts.RatioLtoS;
  this.inactiveColor = "hsla(0,100%,0%,.1)";
  this.activeColor = "hsl(0,100%,0%)";

  Object.defineProperties(this, {'angleRad': {'get': function() {return this.angle * Math.PI / 180;}}});
  Object.defineProperties(this, {'segmentEndAngle': {'get': function() {return Math.atan(Math.cos(this.angleRad) / (1 + Math.sin(this.angleRad)));}}});
  Object.defineProperties(this, {'height': {'get': function() {return this.segmentWidth + 2 * this.segmentLength * Math.cos(this.angleRad) + this.spacing * (Math.sin(this.segmentEndAngle) + Math.cos(this.segmentEndAngle))  + this.spacing * (Math.sin(this.segmentEndAngle) + Math.cos(this.segmentEndAngle)) + 3;}}});
  Object.defineProperties(this, {'width': {'get': function() {return this.segmentWidth + this.segmentLength + 2 * this.segmentLength * Math.sin(this.angleRad) + this.spacing * Math.cos(this.segmentEndAngle) + this.spacing * Math.cos(this.segmentEndAngle) + 3;}}});
  Object.defineProperties(this, {'segmentWidth': {'get': function() {return this.segmentLength / this.ratioLtoH;}}});
  Object.defineProperties(this, {'halfWidth': {'get': function() {return this.segmentWidth / 2;}}});
  Object.defineProperties(this, {'spacing': {'get': function() {return this.ratioLtoS === 0 ? 0 : this.segmentLength / this.ratioLtoS;}}});

  this.segments = this.getDigit();
}

SevenSegmentDigit.BLANK = 10;
SevenSegmentDigit.D = 11;
