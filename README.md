# Tween object

Tween any object deeply while disregarding non numeric values

## Example

### Basic Usage

Give any equivilant primitive (same type) or object (same structure) as from an to parameter. Objects will be recursively parsed and each number will be interpolated. Any non numeric values will be ignored. 

```js
import TweenObject from "tween-object"

let from = 0
let to = 100
// optional: 
let duration = 1
let easing = x => x

let tween = new TweenObject(from, to, duration, easing)
```

The parameters from and to are necessary, duration and easing are optional, while having defaults as shown above. 

```js
tween.onUpdate((val) => {
  console.log(val)
})

console.log(tween.update(.5)) 
```

To use Tween object as an animation interpolator use [animation-frame-delta](https://www.npmjs.com/package/animation-frame-delta) as animation loop handler, as it has been extensively tested to work well in combination.

```js
let from = 250
let to = 500
let duration = 1000
let tween = new TweenObject(from, to, duration)

animationFrameDelta(tween.update.bind(tween), duration)

// or the less cool but more readable version

animationFrameDelta((progress) => {
  tween.update(progress)
}, duration)
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
