# Tween object

Tween any object deeply while disregarding non numeric values

## Example

### Basic Usage

Give any equivilant primitive (same type) or object (same structure) as from an to parameter. Objects will be recursively parsed and every found number will be interpolated. Any non numeric values will be ignored. 

```js
import TweenObject from "tween-object"

let from = 0
let to = 100
// optional: 
let duration = 1
let easing = x => x

let tween = new TweenObject(from, to, duration, easing)
```

Easing must be given as a function recieving a number between `0` and `1` and returning one between `0` and `1`. To generate such functions from bezier easing declarations programatically, have a look at [bezier-easing](https://www.npmjs.com/package/bezier-easing).

-----------------

You can control a tween instance via `update(at?: number)`. `at` spans from 0 to `duration`, thus in this case 0 .. 1. Parameters exceeding this limit will be kept at the maximum. 

When omiting the `at` parameter, the time delta from the inital update will be taken to calculate the progress.

Results can be recieved directly as returned property on the update call, or via a registered `onUpdate` listener. The unregister call `offUpdate(func)`.

```js
tween.onUpdate((val) => {
  console.log(val)
})

console.log(tween.update(.5))
```

-----------------

To use Tween object as an animation interpolator use [animation-frame-delta](https://www.npmjs.com/package/animation-frame-delta) as animation loop handler, as it has been extensively tested to work well in combination.

```js
let from = 250
let to = 500
let duration = 1000
let tween = new TweenObject(from, to, duration)

animationFrameDelta((progress) => {
  tween.update(progress)
}, duration)

// or the more cool but less readable version

animationFrameDelta(tween.update.bind(tween), duration)
```

### Advanced Options

Instead of the shortcuts duration and easing, a object containing more advanced options can be given

```js
let opions = {
  start: 0,
  end: 1000,
  easing: a => a, 
  iterations: 1,
  fill: true
}

let tween = new TweenObject(from, to, options)
```


### Multiple Keyframes

To interpolate over multiple keyframes set the first constructor argument to true and give a list of keyframes as second.

```js
let multipleKeyframes = true
let keyframes = [
  {value: {test: 100}, offset: 0},
  {value: {test: 250}, offset: .3},
  {value: {test: 300}},
  {value: {test: 500}, offset: 1},
]

let tween = new TweenObject(multipleKeyframes, keyframes)
```

The keyframes **must** be given in such a fashion: `{value: Input, offset?: number}` where offsets spans between 0 and 1 (in ascending order). The offset property can be ommited resulting in `{value: Input}`. This way the missing offsets get distrubuted programatically.

Disregarding if an offset is explicitly given, the value must be wrapped inside an object to clearly distinguish between the offset declaration and to be interpolated values. 

### Extention

A use case for Tween object could be the interpolation of svg paths. There is already a library with a more polished implementation of what will be shown here ([tween-svg-path](https://www.npmjs.com/package/tween-svg-path)) out there, but for the sake of getting familiar with the concept I will stick to this use case.

As you want to abstract the inner workings of tweening as far as possible, in order to give the user / developer using it an as easy to understand as possible interface to work with, we will now absract the parsing from the svg-path string to a interpolatable object structure.

> Note: the actual parsing to an object structure will be done by the libraries [parse-svg-path](https://www.npmjs.com/package/parse-svg-path), [abs-svg-path](https://www.npmjs.com/package/abs-svg-path) and [normalize-svg-path](https://www.npmjs.com/package/normalize-svg-path).

> Note: This example uses typescript to display the point of parsing better.

```ts
// The default export (TweenObject) used in the last examples is an implementation of the abstract class Tween without any parsing.
import { Tween } from "tween-object"

import * as parse from "parse-svg-path"
import * as abs from "abs-svg-path"
import * as normalize from "normalize-svg-path"

type Face = string
type Interior = (string | number)[][]

class TweenSvgPath extends Tween<Face, Interior> {
  // override the parseIn method to automatically convert all input to the Interior type (object structure)
  protected parseIn(face: Face): Interior {
    return normalize(abs(parse(face)))
  }
  // override the parseOut method to automatically convert all output to the Face type (svg-path)
  protected parseOut(interior: Interior): Face {
    let s = ""
    for (let i = 0; i < interior.length; i++) {
      s += interior[i].join(" ") + " "
    }
    s = s.substr(0, s.length-1)
    return s
  }
}
```

This way `TweenSvgPath` can be interacted with just by using svgpaths, and never having to parse anything manually.

```ts
let from = "todo"
let to = "todo"
let duration = 2000
let tween = new TweenSvgPath(from, to, duration)

animationFrameDelta(tween.update.bind(tween), duration)

// Note to select to path
const svgPathElem = document.querySelector("svg#tweeny path")
tween.onUpdate((path) => {
  svgPathElem.setAttribute("d", path)
})
```


## Conribute

All feedback is appreciated. Create an pull request or write an issue.
