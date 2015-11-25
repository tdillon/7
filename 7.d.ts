export interface Point {
    x: number;
    y: number;
}
export interface SevenConfig {
    height?: number;
    width?: number;
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
    /** Lookup between which segments are used for each digit.  */
    private static matrix;
    /** The cononical points for a horizontal segment for the given configuration. */
    private _horizontalSegmentGeometry;
    /** The cononical points for a vertical segment for the given configuration. */
    private _verticalSegmentGeometry;
    /** The x and y shifts that must be applied to each segment. */
    private _translations;
    /** The segments, A-G of the digit. */
    segments: Array<Segment>;
    /** This is the angle (in degrees) that the digit is from vertical.  + values mean angled to the right, - values mean angled to the left */
    private _angleDegree;
    /** This is the ratio between the length of a segment and it's width. */
    private _ratioLtoW;
    /** This is the ratio between the length of a segment and the space between 2 segments. */
    private _ratioLtoS;
    /** The overall height of the digit. */
    private _height;
    /**  The 'digit' (e.g., 1, 2, blank) for which the segments will be set to on/off. */
    private _digit;
    /** The overall width of the digit. */
    private _width;
    /** This is the length of each segment in the digit (distance between 1st and 4th points). */
    private _segmentLength;
    /** This is the angle between the first 2 points in the _horizontalSegmentGeometry array and the x axis. */
    private _segmentEndAngle;
    /** This is the horizontal distance between the outer most (furthest to the left or furthest to the right) point on the 2 outer most segments and the 1st or 4th (whichever is closest) point on that same segment. */
    private _segmentHorizontalShiftDistance;
    /** This is the _angleDegree expressed in radians. */
    private _angleRadian;
    /** This is the distance between 2 adjacent segments. */
    private _spacing;
    /** This is half of the segment's width. */
    private _halfSegmentWidth;
    /** When true heigt is fixed, when false, width is fixed. */
    private _isHeightFixed;
    /**
     * Construct a new Seven object.
     * Optionally pass a SevenConfig object to set properties.
     * Each property of the SevenConfig object is optional.
     * If the passed in config contains bad values an exception will be thrown.
     */
    constructor({height, width, angle, ratioLtoW, ratioLtoS, digit}?: SevenConfig);
    /**
     * Check the height, width, angle, ratioLtoH, and ratioLtoS for valid values.
     * Throws exception on first found issue.
     *
     * @private
     */
    private _checkConfig();
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
    ratioLtoW: number;
    ratioLtoS: number;
    digit: Digit;
    height: number;
    width: number;
}
