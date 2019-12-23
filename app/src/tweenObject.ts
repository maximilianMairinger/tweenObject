const now = performance.now.bind(performance)
import clone from "clone"
import spreadOffset from "spread-offset"
import { Data } from "front-db"
import { deepEqual } from "fast-equals"
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

interface Options {
  readonly start?: number
  readonly end?: number
  readonly easing?: (at: number) => number
  readonly iterations?: number
  readonly fill?: boolean
}

const defaultOptions: Options = {
  start: 0,
  end: 1000,
  easing: a => a,
  iterations: 1,
  fill: true
}


function mergeDefaultOptions(options: Options) {
  for (let key in defaultOptions) {
    if (options[key] === undefined) options[key] = defaultOptions[key]
  }
  return options
}


type GenericObject = {[prop: string]: any}
type Keyframes<Interior> = {offset?: number, value: Interior}[]
type offset = number

export abstract class Tween<Face, Interior extends (number | GenericObject) = GenericObject, Input = Face, Output = Face> {
  private _keyframes: Keyframes<Interior>
  private tweeny: Interior;
  private tweenInstancesIndex: Map<offset, SimpleTween[]>

  private updateListeners: ((res: Readonly<Output>) => void)[] = []

  private startTime: number
  private tweenInstancesIndexKeys: number[]
  private lastUpdateAt: number = null

  private options: Options

  private duration: number


  constructor(array: true, keyframes: Keyframes<Input>, duration?: number, easing?: (at: number) => number)
  constructor(array: true, keyframes: Keyframes<Input>, options: Options)
  constructor(from: Input, to: Input, options: Options)
  constructor(from: Input, to: Input, duration?: number, easing?: (at: number) => number)
  constructor(from_array: Input | true, to_keyframes: Input | Keyframes<Input>, duration_options?: number | Options, easing?: (at: number) => number) {
    if (typeof duration_options === "object") {
      this.options = mergeDefaultOptions(duration_options)
    }
    else if (duration_options !== undefined) {
      this.options = mergeDefaultOptions({
        end: duration_options,
        easing,
      })
    }
    else {
      this.options = mergeDefaultOptions({})
    }

    this.duration = this.options.end - this.options.start

    if (from_array === true) this.keyframes(to_keyframes as Keyframes<Input>)
    else {
      this._keyframes = [
        {offset: 0, value: clone(this.parseIn(from_array))},
        {offset: 1, value: clone(this.parseIn(to_keyframes as Input))}
      ]
      this.prepInput()
    }
  }

  protected abstract parseIn(face: Input): Interior
  protected abstract parseOut(interior: Interior): Output

  private lastParsedOutput: Output
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

    at = at - this.options.start

    

    if (at > this.duration) {
      let progress = at / this.duration
      if (progress > this.options.iterations) {
        if (this.options.fill) at = this.duration
        else at = 0
      }
      else at = at - (Math.floor(progress) * this.duration)
    }
    else if (at < 0) at = 0


    at = at / this.duration
    at = this.options.easing(at)


    if (this.lastUpdateAt !== at) {
      let offsets = this.tweenInstancesIndexKeys
    
      for (let i = 0; i < offsets.length - 1; i++) {
        let nextOffset = offsets[i+1]
        let lastOffset = offsets[i]
  
        if (lastOffset <= at && nextOffset >= at) {
          at = (at - lastOffset) / (nextOffset - lastOffset)
          
          this.tweenInstancesIndex.get(lastOffset).ea((tween) => {
            tween.update(at)
          })
          break
        }
      }

      // Notify
      let res = this.parseOut(this.tweeny)
      if (!deepEqual(res, this.lastParsedOutput)) {
        this.updateListeners.ea((f) => {
          f(res)
        })
        this.lastParsedOutput = res
        this.lastUpdateAt = at
      }
    }
    
    return this.lastParsedOutput
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
    if (to !== undefined) {
      this._keyframes.first = {offset: 0, value: clone(this.parseIn(to))}
      this.prepInput()
    }
    else return clone(this.parseOut(this._keyframes.first.value))
  }


  public to(): Output
  public to(to: Input): void
  public to(to?: Input) {
    if (to !== undefined) {
      this._keyframes.last = {offset: 0, value: clone(this.parseIn(to))}
      this.prepInput()
    }
    else return clone(this.parseOut(this._keyframes.last.value))
  }

  public keyframes(): Keyframes<Output>
  public keyframes(to: Keyframes<Input>): void
  public keyframes(to?: Keyframes<Input>): Keyframes<Output> | void {
    if (to !== undefined) {
      let keyframes = clone(to)
      if (keyframes.length < 2) throw new TweenError("Invalid keyframes. Must have a minimum length of 2.")
      keyframes.ea((e, i) => {
        //@ts-ignore
        keyframes[i] = {offset: e.offset, value: this.parseIn(e.value)}
      })
      //@ts-ignore
      this._keyframes = keyframes
      this.prepInput()
    }
    else {
      let keyframes = clone(this._keyframes)
      keyframes.ea((e, i) => {
        //@ts-ignore
        keyframes[i] = {offset: e.offset, value: this.parseOut(e.value)}
      })
      //@ts-ignore
      return keyframes
    }
  }

  private prepInput() {
    spreadOffset(this._keyframes)

    let interiors = this._keyframes.Inner("value")
    this.checkInput(interiors)
    this.tweeny = clone(interiors.first)
    let typeofTweeny = typeof this.tweeny

    this.tweenInstancesIndex = new Map()

    if (typeofTweeny === "object") this.prepTweeny(this.tweeny, this._keyframes)
    //@ts-ignore
    else if (typeofTweeny === "number") {
      for (let i = 0; i < this._keyframes.length - 1; i++) {
        this.tweenInstancesIndex.set(this._keyframes[i].offset, [new SimpleTween(this._keyframes[i].value as unknown as number, this._keyframes[i+1].value as unknown as number, (e) => {
          (this.tweeny as unknown as number) = e
        })])
      }
    }

    this.tweenInstancesIndex.set(1, null)
    this.tweenInstancesIndexKeys = [...this.tweenInstancesIndex.keys()]
  }

  private prepTweeny(tweeny: any, keyframes: Keyframes<Interior>) {
    let typeofFrom: any
    let typeofFromIsNumber: boolean
    let typeofFromIsObject: boolean
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
        try {
          //@ts-ignore
          this.checkInput(interiors.Inner(key))
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

export default class TweenObject<Face extends (number | GenericObject) = (number | GenericObject), Interior extends (number | GenericObject) = (number | GenericObject), Input extends (number | GenericObject) = Face, Output extends (number | GenericObject) = Face> extends Tween<Face, Interior, Input, Output> {
  protected parseIn(face: Input): Interior {
    return face as unknown as Interior
  }
  protected parseOut(interior: Interior): Output {
    return interior as unknown as Output
  }
}




