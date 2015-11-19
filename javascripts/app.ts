import {Seven, Digit} from 'seven-segment/7';

let d = new Seven();
let canvas = <HTMLCanvasElement>document.querySelector('canvas');
let ctx = canvas.getContext('2d');
let inputs = document.querySelectorAll('input[type=range]');
let eleAnimate = <HTMLInputElement>document.querySelector('input[type=checkbox]');
let eleDigits = <HTMLSelectElement>document.querySelector('select');
let eleReset = <HTMLInputElement>document.querySelector('#btnReset');
let eleMenu = <HTMLInputElement>document.querySelector('header');
let eleMenuBtn = <HTMLInputElement>document.querySelector('#btnMenu');
let eleCode = <HTMLSpanElement>document.querySelector('code span');
let eleMain = <HTMLElement>document.querySelector('main');
let intHandle;  //handle to setInterval


function code() {
  eleCode.textContent = '{';
  for (let i = 0, ele; ele = inputs[i]; ++i) {
    eleCode.textContent += `\n  ${ele.dataset['p']}: ${ele.value},`;
  }
  eleCode.textContent += `
  digit: Digit.${Digit[eleDigits.selectedIndex]}\n}`;
}


function reset() {
  d = new Seven();
  for (let i = 0, ele; ele = inputs[i]; ++i) {
    ele.value = d[ele.dataset['p']];
    document.querySelector(`span[data-p=${ele.dataset['p']}]`).textContent = ele.value;
  }
  eleAnimate.checked = false;
  eleDigits.selectedIndex = d.digit;
  clearInterval(intHandle);
  eleCode.textContent = '';
  draw(canvas, ctx, d);
}


function draw(canvas, ctx, digit) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.height = Math.ceil(digit.height + 1);
  canvas.width = Math.ceil(digit.width + 1);

  for (let s of digit.segments) {
    ctx.fillStyle = `rgba(255,255,255,${(s.on ? .87 : .05)})`;
    ctx.beginPath();
    for (let p of s.points) {
      ctx.lineTo(p.x + .5, p.y + .5);
    }
    ctx.closePath();
    ctx.fill();
  }
}


reset();  //reset input elements and draw the digit


//WIRE UP EVENT LISTENERS

for (let i = 0, inp; inp = inputs[i]; ++i) {
  inp.addEventListener('input', e => {
    let ele = <HTMLInputElement>(e.target);

    try {
      d[ele.dataset['p']] = parseFloat(ele.value);
      draw(canvas, ctx, d);
    } catch (ex) {
      ele.value = d[ele.dataset['p']];
      console.log(ex.message);
    }
    document.querySelector(`span[data-p=${ele.dataset['p']}]`).textContent = ele.value;
    code();
  });
}

eleAnimate.addEventListener('change', () => {
  if (eleAnimate.checked) {
    intHandle = setInterval(() => {
      d.digit = (d.digit + 1) % 10;
      eleDigits.selectedIndex = d.digit;
      draw(canvas, ctx, d);
      code();
    }, 1000);
  } else {
    clearInterval(intHandle);
  }
});

eleDigits.addEventListener('change', () => {
  d.digit = eleDigits.selectedIndex;
  draw(canvas, ctx, d);
  code();
});

eleReset.addEventListener('click', reset);

eleMenuBtn.addEventListener('click', () => {
  eleMenu.classList.toggle('hide');
});

eleMain.addEventListener('click', () => {
  eleMenu.classList.add('hide');
});
