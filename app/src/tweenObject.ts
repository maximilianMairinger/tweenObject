const now = performance.now.bind(performance)
import clone from "clone"
require("xrray")(Array)


export class TweenError extends Error {
  constructor(msg: string = "Unknown") {
    super()
    this.message = msg
  }
  public set message(to: string) {
    super.message = "TweenError: " + to
  }
}


export class TweenCheckError extends TweenError {
  private steps: string[] = []
  constructor(private msg: string = "Unknown") {
    super()
    this.message = msg
  }

  public set message(to: string) {
    super.message = "CheckError: " + to
  }

  public addStep(...steps: string[]) {
    this.steps.dda(...steps)

    super.message = "CheckError at \"" + this.steps.join(".") + "\": " + this.msg
  }

}




export class SimpleTween {
  constructor(public from: number, public to: number, public onUpdate: (res: number) => void) {
    
  }
  public update(at: number) {
    this.onUpdate(this.from + (this.to - this.from) * at)
  }
}

type GenericObject = {[prop: string]: any}
type Keyframes<Interior> = {offset: number, value: Interior}[]
type offset = number

export abstract class Tween<Face, Interior extends (number | GenericObject) = GenericObject, Input = Face, Output = Face> {
  private keyframes: Keyframes<Interior>
  private tweeny: Interior;
  private tweenInstancesIndex: Map<offset, SimpleTween[]>

  private updateListeners: ((res: Readonly<Output>) => void)[] = []

  private startTime: number

  constructor(array: true, to: {offset: number, value: Interior}[], duration?: number, easing?: (at: number) => number)
  constructor(from: Input, to: Input, duration?: number, easing?: (at: number) => number)
  constructor(from_array: Input | true, to: Input | {offset: number, value: Interior}[], public duration: number = 1, public easing: (at: number) => number = a => a) {
    if (from_array === true) {
      this.keyframes = to as {offset: number, value: Interior}[]
    }
    else {
      this.keyframes = [
        {offset: 0, value: this.parseIn(from_array)},
        {offset: 1, value: this.parseIn(to as Input)}
      ]
    }
    
    this.prepInput()
  }

  protected abstract parseIn(face: Input): Interior
  protected abstract parseOut(interior: Interior): Output

  public update(at?: number): Readonly<Output> {
    if (at === undefined) {
      if (this.startTime === undefined) {
        at = 0
        this.startTime = now()
      }
      else {
        at = now() - this.startTime
      }
    }

    if (at > this.duration) at = this.duration
    else if (at < 0) at = 0
    at = at / this.duration
    at = this.easing(at)


    
    let offsets = [...this.tweenInstancesIndex.keys()]
    
    for (let i = 0; i < offsets.length - 1; i++) {
      let nextOffset = offsets[i+1]
      let lastOffset = offsets[i]

      if (lastOffset < at && nextOffset >= at) {
        at = (at - lastOffset) / (nextOffset - lastOffset)
        
        this.tweenInstancesIndex.get(lastOffset).ea((tween) => {
          tween.update(at)
        })
        break
      }
    }

    // Notify

    let res = this.parseOut(this.tweeny)
    this.updateListeners.ea((f) => {
      f(res)
    })
    return res
  }

  

  public onUpdate(ls: (res: Readonly<Output>) => void) {
    this.updateListeners.add(ls)
    return ls
  }

  public offUpdate(ls: (res: Readonly<Output>) => void) {
    this.updateListeners.rmV(ls)
  }

  public from(): Output
  public from(to: Input): void
  public from(to?: Input) {
    if (to) {
      this.keyframes.first = {offset: 0, value: this.parseIn(to)}
      this.prepInput()
    }
    else return this.parseOut(this.keyframes.first.value)
  }


  public to(): Output
  public to(to: Input): void
  public to(to?: Input) {
    if (to) {
      this.keyframes.last = {offset: 0, value: this.parseIn(to)}
      this.prepInput()
    }
    else return this.parseOut(this.keyframes.last.value)
    
  }

  private prepInput() {
    let interiors = this.keyframes.Inner("value")
    this.checkInput(interiors)
    this.tweeny = clone(interiors.first)
    let typeofTweeny = typeof this.tweeny

    this.tweenInstancesIndex = new Map()

    if (typeofTweeny === "object") this.prepTweeny(this.tweeny, this.keyframes)
    //@ts-ignore
    else if (typeofTweeny === "number") {
      for (let i = 0; i < this.keyframes.length - 1; i++) {
        this.tweenInstancesIndex.set(this.keyframes[i].offset, [new SimpleTween(this.keyframes[i].value as unknown as number, this.keyframes[i+1].value as unknown as number, (e) => {
          (this.tweeny as unknown as number) = e
        })])
      }
    }

    this.tweenInstancesIndex.set(1, null)
  }

  private prepTweeny(tweeny: any, keyframes: Keyframes<Interior>) {
    let typeofFrom: any
    let typeofFromIsNumber
    let typeofFromIsObject
    for (const key in tweeny) {
      typeofFrom = typeof keyframes.first.value[key]
      typeofFromIsNumber = typeofFrom === "number"
      typeofFromIsObject = typeofFrom === "object"

      for (let i = 0; i < keyframes.length - 1; i++) {
        let offset = keyframes[i].offset
        let from = keyframes[i].value[key]
        let to = keyframes[i + 1].value[key]
  

        if (typeofFromIsNumber) {
          let tweenInstances = this.tweenInstancesIndex.get(offset)
          if (tweenInstances === undefined) {
            let ar = []
            this.tweenInstancesIndex.set(offset, ar)
            tweenInstances = ar
          }
          tweenInstances.add(new SimpleTween(from, to, (e) => {
            tweeny[key] = e
          }))
        }
      }

      if (typeofFromIsObject) {
        let newKeyframe: Keyframes<Interior> = []
        for (let i = 0; i < keyframes.length; i++) {
          newKeyframe[i] = {value: keyframes[i].value[key], offset: keyframes[i].offset}
        }
        this.prepTweeny(tweeny[key], newKeyframe)
      }
    }
    return tweeny
  }

  private checkInput(interiors: Interior[]) {
    let type = typeof interiors.first
    for (let i = 1; i < interiors.length; i++) {
      if (type !== typeof interiors[i]) throw new TweenCheckError("Types are not equal at index " + i + ".")
    }
    if (type === "object") {
      let keys = Object.keys(interiors.first)
      for (let i = 1; i < interiors.length; i++) {
        let me = Object.keys(interiors[i])
        if (keys.length !== me.length) throw new TweenCheckError("Length of keys are not equal at index " + i + ".")
        if (!me.contains(...keys)) throw new TweenCheckError("Keys do not match at index " + i + ".")
      }
      
      for (let key of keys) {
        let inner = []
        keys.ea((e) => {
          inner.add(e[key])
        })
        try {
          this.checkInput(inner)
        }
        catch(e) {
          if (e instanceof TweenCheckError) {
            e.addStep(key)
          }

          throw e
        }
      }
    }
    else if (type !== "number") {
      let val = interiors.first
      for (let i = 1; i < interiors.length; i++) {
        if (val !== interiors[i]) throw new TweenCheckError("Unable to interpolate between none numeric values. When using such, make sure the values are the same at given all given keyframes. Error eccured at index " + i + ".")
      }
    }
  }
}

export default class TweenObject extends Tween<any, any> {

  protected parseOut(interior: any): any {
    return interior  
  }
  
  protected parseIn(face: any): any {
    return face
  }
}




