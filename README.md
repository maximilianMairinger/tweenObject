# Tween object

Tween any object deeply while disregarding non numeric values

## Example

Give any equivilant primitive (same type) or object (same structure) as from an to parameter. Objects will be recursively parsed and each number will be interpolated. Any non numeric values will be ignored. 

```js
import TweenObject from "tweenObject"

let tween = new TweenObject(/*from: */0, /*to: */100, /*duration: */1, /*easing: */x => x)
```

The parameters from and to are necessary, duration and easing are optional, while having defaults as shown above. 

```js
tween.onUpdate((val) => {
  console.log(val)
})

console.log(tween.update(.5)) 
```


## Conribute

All feedback is appreciated. Create an push request or wirte an issue.
