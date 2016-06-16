import {Seven, Digit} from "./seven-segment";

describe('seven-segment tests', () => {
  let s = new Seven();

  it('has default angle of 10', () => { expect(s.angle).toEqual(10); });

  it('has a default height of 100', () => { expect(s.height).toEqual(100); });

  it('has a default length to width ratio of 4', () => { expect(s.ratioLtoW).toEqual(4); });

  it('has a default length to spacing ratio of 32', () => { expect(s.ratioLtoS).toEqual(32); });

  it('has a default digit of blank', () => { expect(s.digit).toEqual(Digit.BLANK); });

  it('height is fixed by default', () => { expect(s.isHeightFixed).toEqual(true); });

  it('width is NOT fixed by default', () => { expect(s.isWidthFixed).toEqual(false); });

  it('should throw error for bad angle(89.9)', () => { expect(() => s.angle = 89.9).toThrowError(); });

});
