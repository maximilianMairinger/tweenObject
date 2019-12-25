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

Instead of the shortcuts duration and easing, a object containing more advanced options can be given. 

```js
let opions = {
  start: 0,
  end: 1,
  easing: a => a, 
  iterations: 1,
  fill: true
}

let tween = new TweenObject(from, to, options)
```

The values displayed above are the defaults, you may omit any of the properties to fall back to these values. 

-----------------

The used config can be read like so

> Note that this is a readonly object. You are unable to change an instantiated tween.

```js
let usedOptions = tween.options

console.log("This tween has " + usedOptions.iterations + " iterations.")
```

These are the given options merged with the default config. This is potentually interesting if youd like to rely on the built in option resolution of tween object as it supports `duration` & `easing` as standalone properties.

### Multiple Keyframes

To interpolate over multiple keyframes set the first constructor argument to true and give a list of keyframes as second.

```js
let multipleKeyframes = true
let keyframes = [
  {prop: 100, offset: 0},
  {prop: 250, offset: .3},
  {prop: 300},
  {prop: 500, offset: 1}
]

let tween = new TweenObject(multipleKeyframes, keyframes)
```

The offset property on a keyframes indecates the position in the animation (0 beeing the begin and 1 the end), similar to the [WAAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats) implementation. Offset can be omit as it will be filled by equally distributed values (thus, `0.65` for the above example).

-----------------

Side Note: Single property keyframes can be given not nested inside a explicit object. This notation (useing wrapped primitives) works as well

```js
let multipleKeyframes = true
let specialPropWithOffset = new Number(250)
specialPropWithOffset.offset = .3
let keyframes = [
  100
  specialPropWithOffset
  300,
  500
]

let tween = new TweenObject(multipleKeyframes, keyframes)
```


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
