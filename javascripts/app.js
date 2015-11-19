var _7_1 = require('seven-segment/7');
var d = new _7_1.Seven();
var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var inputs = document.querySelectorAll('input[type=range]');
var eleAnimate = document.querySelector('input[type=checkbox]');
var eleDigits = document.querySelector('select');
var eleReset = document.querySelector('#btnReset');
var eleMenu = document.querySelector('header');
var eleMenuBtn = document.querySelector('#btnMenu');
var eleCode = document.querySelector('code span');
var eleMain = document.querySelector('main');
var intHandle; //handle to setInterval
function code() {
    eleCode.textContent = '{';
    for (var i = 0, ele = void 0; ele = inputs[i]; ++i) {
        eleCode.textContent += "\n  " + ele.dataset['p'] + ": " + ele.value + ",";
    }
    eleCode.textContent += "\n  digit: Digit." + _7_1.Digit[eleDigits.selectedIndex] + "\n}";
}
function reset() {
    d = new _7_1.Seven();
    for (var i = 0, ele = void 0; ele = inputs[i]; ++i) {
        ele.value = d[ele.dataset['p']];
        document.querySelector("span[data-p=" + ele.dataset['p'] + "]").textContent = ele.value;
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
    for (var _i = 0, _a = digit.segments; _i < _a.length; _i++) {
        var s = _a[_i];
        ctx.fillStyle = "rgba(255,255,255," + (s.on ? .87 : .05) + ")";
        ctx.beginPath();
        for (var _b = 0, _c = s.points; _b < _c.length; _b++) {
            var p = _c[_b];
            ctx.lineTo(p.x + .5, p.y + .5);
        }
        ctx.closePath();
        ctx.fill();
    }
}
reset(); //reset input elements and draw the digit
//WIRE UP EVENT LISTENERS
for (var i = 0, inp = void 0; inp = inputs[i]; ++i) {
    inp.addEventListener('input', function (e) {
        var ele = (e.target);
        try {
            d[ele.dataset['p']] = parseFloat(ele.value);
            draw(canvas, ctx, d);
        }
        catch (ex) {
            ele.value = d[ele.dataset['p']];
            console.log(ex.message);
        }
        document.querySelector("span[data-p=" + ele.dataset['p'] + "]").textContent = ele.value;
        code();
    });
}
eleAnimate.addEventListener('change', function () {
    if (eleAnimate.checked) {
        intHandle = setInterval(function () {
            d.digit = (d.digit + 1) % 10;
            eleDigits.selectedIndex = d.digit;
            draw(canvas, ctx, d);
            code();
        }, 1000);
    }
    else {
        clearInterval(intHandle);
    }
});
eleDigits.addEventListener('change', function () {
    d.digit = eleDigits.selectedIndex;
    draw(canvas, ctx, d);
    code();
});
eleReset.addEventListener('click', reset);
eleMenuBtn.addEventListener('click', function () {
    eleMenu.classList.toggle('hide');
});
eleMain.addEventListener('click', function () {
    eleMenu.classList.add('hide');
});
//# sourceMappingURL=app.js.map