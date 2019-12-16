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


export abstract class Tween<Face, Interior extends any = GenericObject, Input = Face, Output = Face> {
  private keyframes: {offset: number, value: Interior}[]
  private tweeny: Interior;
  private tweenInstances: SimpleTween[] = []

  private updateListeners: ((res: Readonly<Output>) => void)[] = []

  private startTime: number

  constructor(from: Input, to: Input, duration: number, easing: (at: number) => number)
  constructor(array: true, to: {offset: number, value: Interior}[], duration: number, easing: (at: number) => number)
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

  protected updateWithoutNotification(at?: number) {
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

    this.tweenInstances.ea((tween) => {
      tween.update(at)
    })
  }

  protected abstract parseIn(face: Input): Interior
  protected abstract parseOut(interior: Interior): Output

  public update(at?: number): Readonly<Output> {
    this.updateWithoutNotification(at)
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
    this.checkInput(this._from, this._to)


    this.tweeny = clone(this._from)
    let typeofTweeny = typeof this.tweeny
    if (typeofTweeny === "object") this.prepTweeny(this.tweeny, this._to)
    //@ts-ignore
    else if (typeofTweeny === "number") this.tweenInstances.add(new SimpleTween(this._from, this._to, (e) => {
      this.tweeny = e
    }))
  }

  private prepTweeny(tweeny: any, _to: any) {
    let typeofFrom: any
    for (const key in tweeny) {
      let from = tweeny[key]
      let to = _to[key]
      typeofFrom = typeof from
      if (typeofFrom === "number") {
        this.tweenInstances.add(new SimpleTween(from, to, (e) => {
          tweeny[key] = e
        }))
      }
      else if (typeofFrom === "object") {
        this.prepTweeny(from, to)
      }
    }
  }

  private checkInput(keyframes: Interior[]) {
    let type = typeof keyframes.first
    for (let i = 1; i < keyframes.length; i++) {
      if (type !== typeof keyframes[i]) throw new TweenCheckError("Types are not equal at index " + i + ".")
    }
    if (type === "object") {
      let keys = Object.keys(keyframes.first)
      for (let i = 1; i < keyframes.length; i++) {
        let me = Object.keys(keyframes[i])
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
      let val = keyframes.first
      for (let i = 1; i < keyframes.length; i++) {
        if (val !== keyframes[i]) throw new TweenCheckError("Unable to interpolate between none numeric values. When using such, make sure the values are the same at given all given keyframes. Error eccured at index " + i + ".")
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




