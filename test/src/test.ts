import InterpolateObject, { Interpolater } from "../../app/src/tweenObject"
import bez from "bezier-easing"
import animationFrameDelta from "animation-frame-delta"

let easeInOut = bez(.42, 0, .58, 1)




let interpolater = new InterpolateObject(0, 10, 1000, easeInOut)


console.log(interpolater.update(.3));



interpolater.onUpdate((e) => {
  console.log("update: " + e);
  
})


animationFrameDelta(() => {
  //todo
})





type Segments = (string | number)[][]


const parse = require('parse-svg-path');
const abs = require('abs-svg-path');
const normalize = require('normalize-svg-path');

class SvgPathInterpolator extends Interpolater<string, Segments> {
  protected parseIn(face: string): Segments {
    return normalize(abs(parse(face)))
  }

  protected parseOut(interior: Segments) {
    let i = 0
    let s = ""
    let length = interior.length
    for (; i < length; i++) {
      s += interior[i].join(" ") + " "
    }
    s = s.substr(0, s.length-1)
    return s
  }
}

