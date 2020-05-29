// Simple version for stringify, used for displaying object abstract.
import {
  escape,
  toStr,
  contain,
  startWith,
  escapeJsonStr,
  each,
  getObjType,
  endWith,
  isEmpty
} from './util'
import evalCss from './evalCss'

let hasEvalCss = false

// Modified from: https://jsconsole.com/
export default function getAbstract(
  obj,
  { topObj, level = 0, getterVal = false, unenumerable = true } = {}
) {
  if (!hasEvalCss) {
    evalCss(require('./abstract.scss'))
    hasEvalCss = true
  }

  let json = ''
  let type = ''
  const keyNum = 5
  const parts = []
  let names = []
  let objEllipsis = ''
  const circular = false
  let i

  topObj = topObj || obj

  const passOpts = { getterVal, unenumerable, level: level + 1 }
  const doStringify = level === 0

  const keyWrapper = '<span class="eruda-key">'
  const numWrapper = '<span class="eruda-number">'
  const nullWrapper = '<span class="eruda-null">'
  const strWrapper = '<span class="eruda-string">'
  const boolWrapper = '<span class="eruda-boolean">'
  const specialWrapper = '<span class="eruda-special">'
  const strEscape = str =>
    escape(str)
      .replace(/\\n/g, '↵')
      .replace(/\\f|\\r|\\t/g, '')
      .replace(/\\/g, '')
  const wrapperEnd = '</span>'

  const wrapKey = key => keyWrapper + strEscape(key) + wrapperEnd
  const wrapNum = num => numWrapper + num + wrapperEnd
  const wrapRegExp = str => strWrapper + str + wrapperEnd
  const wrapBool = bool => boolWrapper + bool + wrapperEnd
  const wrapNull = str => nullWrapper + str + wrapperEnd

  function wrapStr(str) {
    str = toStr(str)

    if (contain(SPECIAL_VAL, str) || startWith(str, 'Array[')) {
      return specialWrapper + strEscape(str) + wrapperEnd
    }

    return strWrapper + strEscape(`"${str}"`) + wrapperEnd
  }

  function objIteratee(name) {
    if (i > keyNum) {
      objEllipsis = ', …'
      return
    }
    const key = wrapKey(escapeJsonStr(name))

    if (!getterVal) {
      const descriptor = Object.getOwnPropertyDescriptor(obj, name)
      if (descriptor.get) {
        parts.push(`${key}: ${wrapStr('(...)')}`)
        i++
        return
      }
    }
    parts.push(`${key}: ${getAbstract(topObj[name], passOpts)}`)
    i++
  }

  try {
    type = {}.toString.call(obj)
  } catch (e) {
    type = '[object Object]'
  }

  const isStr = type == '[object String]'
  const isArr = type == '[object Array]'
  const isObj = type == '[object Object]'
  const isNum = type == '[object Number]'
  const isRegExp = type == '[object RegExp]'
  const isSymbol = type == '[object Symbol]'
  const isFn = type == '[object Function]'
  const isBool = type == '[object Boolean]'

  if (circular) {
    json = wrapStr('[circular]')
  } else if (isStr) {
    json = wrapStr(escapeJsonStr(obj))
  } else if (isRegExp) {
    json = wrapRegExp(escapeJsonStr(obj.toString()))
  } else if (isFn) {
    json = wrapStr('ƒ')
  } else if (isArr) {
    if (doStringify) {
      json = '['
      let len = obj.length
      let arrEllipsis = ''

      if (len > 100) {
        len = 100
        arrEllipsis = ', …'
      }
      for (let i = 0; i < len; i++) {
        parts.push(`${getAbstract(obj[i], passOpts)}`)
      }
      json += parts.join(', ') + arrEllipsis + ']'
    } else {
      json = `Array(${obj.length})`
    }
  } else if (isObj) {
    if (canBeProto(obj)) {
      obj = Object.getPrototypeOf(obj)
    }

    names = unenumerable ? Object.getOwnPropertyNames(obj) : Object.keys(obj)
    if (doStringify) {
      i = 1
      json = '{ '
      each(names, objIteratee)
      json += parts.join(', ') + objEllipsis + ' }'
    } else {
      json = getObjType(obj)
      if (json === 'Object') json = '{…}'
    }
  } else if (isNum) {
    json = obj + ''
    if (endWith(json, 'Infinity') || json === 'NaN') {
      json = `"${json}"`
    } else {
      json = wrapNum(json)
    }
  } else if (isBool) {
    json = wrapBool(obj ? 'true' : 'false')
  } else if (obj === null) {
    json = wrapNull('null')
  } else if (isSymbol) {
    json = wrapStr('Symbol')
  } else if (obj === undefined) {
    json = wrapStr('undefined')
  } else {
    try {
      if (canBeProto(obj)) {
        obj = Object.getPrototypeOf(obj)
      }

      if (doStringify) {
        i = 1
        json = '{ '
        names = unenumerable
          ? Object.getOwnPropertyNames(obj)
          : Object.keys(obj)
        each(names, objIteratee)
        json += parts.join(', ') + objEllipsis + ' }'
      } else {
        json = getObjType(obj)
        if (json === 'Object') json = '{…}'
      }
    } catch (e) {
      json = wrapStr(obj)
    }
  }

  return json
}

const SPECIAL_VAL = ['(...)', 'undefined', 'Symbol', 'Object', 'ƒ']

function canBeProto(obj) {
  const emptyObj = isEmpty(Object.getOwnPropertyNames(obj))
  const proto = Object.getPrototypeOf(obj)

  return emptyObj && proto && proto !== Object.prototype
}
