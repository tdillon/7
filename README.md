### Demo
Visit http://tdillon.github.io/7/demo.html for a demo of what information this library can produce.

### Installation
You can use npm, jspm, or directly link the files as you see fit.

```shell
npm i seven-segment --save
```

After you have the library, import it.

```javascript
import {Seven} from 'seven-segment/7';
```

### Basic options
The default options give you a quintessential seven segment.

```javascript
var x = new Seven();
```

### Configuration Parameter
You can optionally pass a configuration object to the constructor.  Each property is optional.

```javascript
//import Digit if you want access to the enum for setting the digit type.
import {Seven, Digit} from 'seven-segment/7';

var x = new Seven({height: 50, angle: 0, ratioLtoW: 2, ratioLtoS: .5, digit: Digit.TWO});
```

### Setters
You can configure the `Seven` by using setters after the object has been instantiated.

```javascript
var x = new Seven();
x.height = 20;  //or x.width = 20
x.angle = -25;
x.ratioLtoW = 4;
x.ratioLtoS = 5;
x.digit = Digit.SIX;
```

### Getters
Each of the configuration properties are getters.

```javascript
var x = new Seven();
console.log(x.height, x.width, x.angle, x.ratioLtoW, x.ratioLtoS, Digit[x.digit]);
```

### Exceptions
Setting the configuration properties to invalid values will cause an exception to be thrown.  All properties expect a number, except for the digit property which expects a member of the Digit enum.  Passing a string that can be converted to a number may work.  Objects, nulls, and other 'non-numeric' values will throw exceptions.  Setting a property to a number which would produce bad geometry will also throw an exception.  You should wrap construction and property setters in try/catches if you are unsure of the validity of the settings.

```javascript
//constructor throws an exception
var x = new Seven({angle: 'foo'});  //ERROR

//setting a property throws an exception
var x = new Seven();
x.angle = 89;  //ERROR, too sharp an angle produces bad geometry
```

### Geometry
Finally, we've configured our `Seven` how we want it, now we can access the geometry.

```javascript
var x = new Seven();

for (let s of x.segments) {  //Access the segments A-G
  //'on' specifies if the segment is used for the 'digit' specified
  if (s.on) {
    for (let p of s.points) {  //each segment has a 'point' array
      console.log(p.x, p.y);  //points have 'x' and 'y' properties
    }
  }
}
```
