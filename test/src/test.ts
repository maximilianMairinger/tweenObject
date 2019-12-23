import TweenObject, { Tween } from "../../app/src/tweenObject"
import bez from "bezier-easing"
import animationFrameDelta from "animation-frame-delta"

let easeInOut = bez(.42, 0, .58, 1)


let duration = 1000
let iterations = 2

let interpolater = new TweenObject(0, 100, {
  start: 0,
  end: 1000,
  iterations,
  fill: false
})



setTimeout(() => {
  let last = 0
  interpolater.onUpdate((e) => {
    //@ts-ignore
    console.log("update:", e, e - last);
    //@ts-ignore
    //if (Math.abs(e - last) > 10) debugger
    last = e as unknown as number
  })


  animationFrameDelta(interpolater.update.bind(interpolater), duration, iterations)
}, 200)









// type Segments = (string | number)[][]


// const parse = require('parse-svg-path');
// const abs = require('abs-svg-path');
// const normalize = require('normalize-svg-path');

// class SvgPathInterpolator extends Tween<string, Segments> {
//   protected parseIn(face: string): Segments {
//     return normalize(abs(parse(face)))
//   }

//   protected parseOut(interior: Segments) {
//     let s = ""
//     for (let i = 0; i < interior.length; i++) {
//       s += interior[i].join(" ") + " "
//     }
//     s = s.substr(0, s.length-1)
//     return s
//   }
// }

