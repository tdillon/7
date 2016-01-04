import {Seven, Digit, Point} from 'seven-segment/7';
import {Component} from 'angular2/core';

@Component({
  selector: 'seven-segment-demo',
  templateUrl: 'src/demo.component.html'
})
export class SevenSegmentDemoComponent {
  d: Seven;
  hideMenu = false;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  count = true;
  intHandle;
  digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];


  bar(val) {
    return Digit[val];
  }

  constructor() {
    this.canvas = <HTMLCanvasElement>document.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.reset();
    this.animate();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.height = Math.ceil(this.d.height + 1);
    this.canvas.width = Math.ceil(this.d.width + 1);

    for (let s of this.d.segments) {
      this.ctx.fillStyle = `rgba(255,255,255,${(s.on ? .87 : .05) })`;
      this.ctx.beginPath();
      for (let p of s.points) {
        this.ctx.lineTo(p.x + .5, p.y + .5);
      }
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  hide() {
    this.hideMenu = !this.hideMenu;
  }

  get code(): string {
    return `var x = new Seven({
  ${this.d.isHeightFixed ? 'height' : 'width'}: ${this.d.isHeightFixed ? this.d.height : this.d.width},
  angle: ${this.d.angle},
  ratioLtoW: ${this.d.ratioLtoW},
  ratioLtoS: ${this.d.ratioLtoS},
  digit: Digit.${Digit[this.d.digit]}
})`;
  }

  animate() {
    clearInterval(this.intHandle);

    if (this.count) {
      this.intHandle = setInterval(() => {
        this.d.digit = (this.d.digit + 1) % 10;
        this.draw();
      }, 1000);
    }
  }


  reset() {
    this.d = new Seven();
    this.draw();
  }
}
