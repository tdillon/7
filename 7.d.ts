export interface Point {
    x: number;
    y: number;
}
export interface SevenConfig {
    segmentLength?: number;
    angle?: number;
    ratioLtoW?: number;
    ratioLtoS?: number;
    digit?: Digit;
}
export declare enum Digit {
    ZERO = 0,
    ONE = 1,
    TWO = 2,
    THREE = 3,
    FOUR = 4,
    FIVE = 5,
    SIX = 6,
    SEVEN = 7,
    EIGHT = 8,
    NINE = 9,
    BLANK = 10,
    D = 11,
}
export declare class Segment {
    on: boolean;
    points: Array<Point>;
    off: boolean;
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
export declare class Seven {
    static matrix: boolean[][];
    private _horizontalSegmentGeometry;
    private _verticalSegmentGeometry;
    private _translations;
    private _angleDegree;
    private _segmentLength;
    private _ratioLtoW;
    private _ratioLtoS;
    private _height;
    private _width;
    private _segmentEndAngle;
    private _segmentHorizontalShiftDistance;
    private _angleRadian;
    private _spacing;
    private _halfSegmentWidth;
    segments: Array<Segment>;
    private _digit;
    /**
     * Construct a new Seven object.
     * Optionally pass a SevenConfig object to set properties.
     * Each property of the SevenConfig object is optional.
     * If the passed in config contains bad values an exception will be thrown.
     */
    constructor({segmentLength, angle, ratioLtoW, ratioLtoS, digit}?: SevenConfig);
    /**
     * Check the segmentLength, angle, ratioLtoH, and ratioLtoS for valid values.
     * Throws exception on first found issue.
     *
     * @private
     */
    private _checkConfig();
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
    private _calculateSegmentGeometry();
    /**
     * This method first calls _calculateSegmentGeometry to populate the horizontal and vertical geometry arrays.
     * Then, the x and y translations for each segment are calculated.
     * Finally, the translations are applied to each segment.
     *
     * @private
     */
    private _positionSegments();
    private _set(prop, value);
    angle: number;
    segmentLength: number;
    ratioLtoW: number;
    ratioLtoS: number;
    digit: Digit;
    height: number;
    width: number;
}
