//@flow

type ReactWMType = {|
  constants: {},
  portals: {}
|}

export const createGlobaleactWM = () => {
  if (!window.ReactWM) {
    window.ReactWM = ({
      constants: {},
      portals: {},
    }: ReactWMType)
  }

  return window.ReactWM
}

export const ReactWM = createGlobaleactWM()

export const findHighestZIndex = (selector: string = '*'): number => {
  let nodes = document.querySelectorAll(selector)
  let highest = 0

  for (let i = 0; i < nodes.length; i++) {
    let zindex = document.defaultView.getComputedStyle(nodes[i], null).getPropertyValue('z-index')
    if (zindex !== 'auto' && +zindex > highest) {
      highest = +zindex
    }
  }

  return highest
}

export const syntaxHighlight = (json: Object | string): string => {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, undefined, 2)
  }

  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|,\n)/g,
    (match) => {
      let cls = 'number'

      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key'
          match = match.slice(1, -2) + ':'
        } else {
          cls = 'string'
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean'
      } else if (/null/.test(match)) {
        cls = 'null'
      } else if (/\d+(\.\d+)?/.test(match)) {
        cls = 'number'
      } else if (/,\n/.test(match)) {
        cls = 'comma'
      }

      return `<span class="${cls}">${match}</span>`
    },
  )
}


export type ClampParamsType = { value: number, min: number, max: number }

const _clamp = ({ value, min, max }: ClampParamsType): number => {
  if (min !== undefined && value <= min) return min
  if (max !== undefined && value >= max) return max

  return value
}

export const clamp = (value: void | number | ClampParamsType, min?: number = -Infinity, max?: number = Infinity): number => {
  if (value === undefined) return parseFloat(min)

  if (typeof value === 'object') {
    return _clamp(value)
  } else {
    return _clamp({ value, min, max })
  }
}

export const align = (value: number, snap: number) => {
  if (snap <= 0) return Math.round(value)
  return Math.round(value - value % snap)
}

export const clearEvent = (e: SyntheticEvent<> | MouseEvent) => {
  e.stopPropagation()
  e.preventDefault()
}

export const getScreenSize = (): { width: number, height: number } => ({
  width: window.innerWidth,
  height: window.innerHeight,
})

export const constants = {}
ReactWM.constants = constants

export function nextConst(name: string = '', namespace: number | string = 0) {
  if (!constants.hasOwnProperty(namespace)) constants[namespace] = {}
  const n = Object.keys(constants[namespace]).length

  if (n === 53) throw new Error(`Maximum id excided in namespace: ${namespace}`)

  return constants[namespace][name] = 2 ** n
}
