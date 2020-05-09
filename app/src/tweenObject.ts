const now = performance.now.bind(performance)
import clone from "tiny-clone"
import spreadOffset from "spread-offset"
import { deepEqual } from "fast-equals"
export * from "waapi-easing"
import Easing from "waapi-easing"
import Xrray from "xrray"
Xrray(Array)


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


export interface OptionsA {
  readonly duration: number
  readonly easing?: (at: number) => number | Easing
  readonly iterations?: number
  readonly fill?: boolean
}


export interface OptionsB {
  readonly start?: number
  readonly end?: number
  readonly easing?: (at: number) => number | Easing
  readonly iterations?: number
  readonly fill?: boolean
}

export type Options = OptionsA | OptionsB



interface InternalOptions {
  readonly start: number
  readonly end: number
  readonly duration: number
  readonly easing: (at: number) => number
  readonly iterations: number
  readonly fill: boolean
}

const defaultOptions: OptionsA & OptionsB = {
  start: 0,
  end: 1000,
  duration: 1000,
  easing: a => a,
  iterations: 1,
  fill: true
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};


function mergeDefaultOptions(options: OptionsA | OptionsB): InternalOptions {
  //@ts-ignore
  let hasDuration = options.duration !== undefined
  for (let key in defaultOptions) {
    if (options[key] === undefined) options[key] = defaultOptions[key]
  }

  if (hasDuration) (options as Mutable<OptionsB>).end = (options as OptionsA).duration;
  else (options as Mutable<OptionsA>).duration = (options as OptionsB).end - (options as OptionsB).start;

  if ((options as OptionsA).easing instanceof Easing) (options as Mutable<InternalOptions>).easing = (options as OptionsA as any).easing.function

  return options as InternalOptions
}



type GenericObject = {[prop: string]: any}
type Keyframes<Interior> = ({offset?: number} & Interior)[]
type offset = number



export abstract class Tween<Input, Interior extends GenericObject = GenericObject, Output = Input> {
  private _keyframes: Keyframes<Interior>
  private tweeny: Interior;
  private tweenInstancesIndex: Map<offset, SimpleTween[]>

  private updateListeners: ((res: Output) => void)[] = []

  private startTime: number
  private tweenInstancesIndexKeys: number[]
  private lastUpdateAt: number = null

  public readonly options: Readonly<InternalOptions>


  constructor(array: true, keyframes: Keyframes<Input>, duration?: number, easing?: (at: number) => number | Easing)
  constructor(array: true, keyframes: Keyframes<Input>, options: OptionsA | OptionsB)
  constructor(from: Input & {offset?: never}, to: Input, options: OptionsA | OptionsB)
  constructor(from: Input & {offset?: never}, to: Input, duration?: number, easing?: (at: number) => number | Easing)
  constructor(from_array: Input | true, to_keyframes: Input | Keyframes<Input>, duration_options?: number | OptionsA | OptionsB, easing?: (at: number) => number | Easing) {
    if (typeof duration_options === "object") this.options = mergeDefaultOptions(duration_options) as any
    else if (duration_options !== undefined) this.options = mergeDefaultOptions({
      end: duration_options,
      easing,
    }) as any
    else this.options = defaultOptions as any


    if (from_array === true) this.keyframes(to_keyframes as Keyframes<Input>)
    else {
      this._keyframes = [
        this.parseInAndWrap(from_array),
        this.parseInAndWrap(to_keyframes as Input)
      ]
      this._keyframes[0].offset = 0
      this._keyframes[1].offset = 1
      
      this.prepInput()
    }
  }

  private isWrapped: boolean = false
  private wrap(toBeWrapped: any): any {
    this.isWrapped = typeof toBeWrapped !== "object"
    return this.isWrapped ? {wrap: toBeWrapped} : toBeWrapped
  }

  private unwrap(toBeUnwrapped: any): any{
    return this.isWrapped ? toBeUnwrapped.wrap : toBeUnwrapped
  }

  private parseInAndWrap(input: Input): any {
    return this.wrap(this.parseIn(input))
  }

  private parseOutAndUnwrap(interior: Interior) {
    return this.parseOut(this.unwrap(interior))
  }

  protected abstract parseIn(input: Input): Interior
  protected abstract parseOut(interior: Interior): Output

  private lastParsedOutput: Output
  public update(at?: number): Output {
    if (at === undefined) {
      if (this.startTime === undefined) {
        at = 0
        this.startTime = now()
      }
      else {
        at = now() - this.startTime
      }
    }

    let inIteration = Math.floor(at / this.options.end) + 1
    at = at - inIteration * this.options.start
    at = at - (inIteration - 1) * this.options.duration
    

      
    if (inIteration > this.options.iterations) {
      if (this.options.fill) at = this.options.duration
      else at = 0
    }
    else if (at < 0) at = 0


    at = at / this.options.duration
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
      let res = this.parseOutAndUnwrap(this.tweeny)
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

  

  public onUpdate(ls: (res: Output) => void) {
    this.updateListeners.add(ls)
    return ls
  }

  public offUpdate(ls: (res: Output) => void) {
    this.updateListeners.rmV(ls)
  }

  public from(): Output & {offset?: never}
  public from(to: Input & {offset?: never}): void
  public from(to?: Input & {offset?: never}) {
    if (to !== undefined) {
      this._keyframes.first = this.parseInAndWrap(to)
      this._keyframes.first.offset = 0
      this.prepInput()
    }
    else return this.parseOutAndUnwrap(this._keyframes.first)
  }


  public to(): Output & {offset?: never}
  public to(to: Input & {offset?: never}): void
  public to(to?: Input & {offset?: never}) {
    if (to !== undefined) {
      this._keyframes.last = this.parseInAndWrap(to)
      this._keyframes.last.offset = 1
      this.prepInput()
    }
    else return this.parseOutAndUnwrap(this._keyframes.last)
  }

  public keyframes(): Keyframes<Output>
  public keyframes(to: Keyframes<Input>): void
  public keyframes(to?: Keyframes<Input>): Keyframes<Output> | void {
    if (to !== undefined) {
      this._keyframes = []
      if (to.length < 2) throw new TweenError("Invalid keyframes. Must have a minimum length of 2.")
      let offset: number
      to.ea((e, i) => {
        let hasOffset = offset !== undefined
        if (hasOffset) {
          offset = e.offset
          delete e.offset 
        }
        
        this._keyframes[i] = this.parseInAndWrap(e)
        
        if (hasOffset) {
          this._keyframes[i].offset = offset
          e.offset = offset
        }
        
      })
      this.prepInput()
    }
    else {
      let newKeyframes = []
      let offset: number
      this._keyframes.ea((e, i) => {
        let hasOffset = offset !== undefined
        if (hasOffset) {
          offset = e.offset
          delete e.offset 
        }
        
        newKeyframes[i] = this.parseOutAndUnwrap(e)
        
        if (hasOffset) {
          this._keyframes[i].offset = offset
          e.offset = offset
        }
      })
      //@ts-ignore
      return newKeyframes
    }
  }

  private prepInput() {
    spreadOffset(this._keyframes)

    this.checkInput(this._keyframes)
    this.tweeny = clone(this._keyframes.first)
    delete this.tweeny.offset

    this.tweenInstancesIndex = new Map()

    this.prepTweeny(this.tweeny, this._keyframes)


    this.tweenInstancesIndex.set(1, null)
    this.tweenInstancesIndexKeys = [...this.tweenInstancesIndex.keys()]
  }

  private prepTweeny(tweeny: any, keyframes: Keyframes<Interior>) {
    let typeofFrom: any
    let typeofFromIsNumber: boolean
    let typeofFromIsObject: boolean
    const offsetString: "offset" = "offset"
    for (const key in tweeny) {
      typeofFrom = typeof keyframes.first[key]
      typeofFromIsNumber = typeofFrom === "number"
      typeofFromIsObject = typeofFrom === "object"

      for (let i = 0; i < keyframes.length - 1; i++) {
        let offset = keyframes[i].offset
        let from = keyframes[i][key]
        let to = keyframes[i + 1][key]
  

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
        //@ts-ignore
        let newKeyframe: Keyframes<Interior> = keyframes.Inner(key)
        for (let i = 0; i < keyframes.length; i++) {
          newKeyframe[i].offset = keyframes[i].offset
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

export default class TweenObject<Input, Interior extends GenericObject = GenericObject, Output = Input> extends Tween<Input, Interior, Output> {
  protected parseIn(face: Input): Interior {
    return clone(face) as unknown as Interior
  }
  protected parseOut(interior: Interior): Output {
    return clone(interior) as unknown as Output
  }
}




