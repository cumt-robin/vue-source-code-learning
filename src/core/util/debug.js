/* @flow */

import config from '../config'
import { noop } from 'shared/util'

export let warn = noop
export let tip = noop
export let generateComponentTrace = (noop: any) // work around flow check
export let formatComponentName = (noop: any)

if (process.env.NODE_ENV !== 'production') {
  const hasConsole = typeof console !== 'undefined'
  const classifyRE = /(?:^|[-_])(\w)/g
  // 先大写，然后去掉-_这种，变成大驼峰形式
  const classify = str => str
    .replace(classifyRE, c => c.toUpperCase())
    .replace(/[-_]/g, '')

  warn = (msg, vm) => {
    const trace = vm ? generateComponentTrace(vm) : ''

    if (config.warnHandler) {
      config.warnHandler.call(null, msg, vm, trace)
    } else if (hasConsole && (!config.silent)) {
      console.error(`[Vue warn]: ${msg}${trace}`)
    }
  }

  tip = (msg, vm) => {
    if (hasConsole && (!config.silent)) {
      console.warn(`[Vue tip]: ${msg}` + (
        vm ? generateComponentTrace(vm) : ''
      ))
    }
  }

  // 格式化组件名
  formatComponentName = (vm, includeFile) => {
    if (vm.$root === vm) {
      // 如果从vm取得的$root属性和vm相同，那么说明vm就是根节点
      return '<Root>'
    }
    const options = typeof vm === 'function' && vm.cid != null
      ? vm.options
      : vm._isVue
        ? vm.$options || vm.constructor.options
        : vm
    let name = options.name || options._componentTag
    const file = options.__file
    if (!name && file) {
      const match = file.match(/([^/\\]+)\.vue$/)
      name = match && match[1]
    }

    // 有组件名就返回组件名，否则返回匿名<Anonymous>
    return (
      (name ? `<${classify(name)}>` : `<Anonymous>`) +
      (file && includeFile !== false ? ` at ${file}` : '')
    )
  }

  const repeat = (str, n) => {
    let res = ''
    while (n) {
      // 如果是奇数，直接追加str
      if (n % 2 === 1) res += str
      // 如果repeat次数大于1，str自身copy
      if (n > 1) str += str
      // n右移1位，相当于除以2
      // 这样应该是为了降低复杂度，把O(N)变成O(logN)
      n >>= 1
    }
    return res
  }

  // 获取组件轨迹
  generateComponentTrace = vm => {
    if (vm._isVue && vm.$parent) {
      // 根据$parent递归
      const tree = []
      // 记录组件自身递归次数
      let currentRecursiveSequence = 0
      while (vm) {
        if (tree.length > 0) {
          const last = tree[tree.length - 1]
          // 此时vm是last的$parent
          if (last.constructor === vm.constructor) {
            // 如果上个vm的构造器和它的$parent构造器相同，说明存在组件递归调用自身的情况，这种情况应该忽略，否则这个轨迹就非常长了
            currentRecursiveSequence++
            vm = vm.$parent
            continue
          } else if (currentRecursiveSequence > 0) {
            // 构造器不同了，说明不是在递归调用组件自身了，这个时候把上一项记录修改一下，同时记录递归的次数currentRecursiveSequence
            tree[tree.length - 1] = [last, currentRecursiveSequence]
            currentRecursiveSequence = 0
          }
        }
        tree.push(vm)
        vm = vm.$parent
      }
      return '\n\nfound in\n\n' + tree
        .map((vm, i) => `${
          i === 0 ? '---> ' : repeat(' ', 5 + i * 2)
        }${
          Array.isArray(vm)
            ? `${formatComponentName(vm[0])}... (${vm[1]} recursive calls)` // 如果存在递归调用组件自身的情况，提示出来
            : formatComponentName(vm)
        }`)
        .join('\n')
    } else {
      // 没有$parent，直接输出组件名
      return `\n\n(found in ${formatComponentName(vm)})`
    }
  }
}
