/* @flow */

import { mergeOptions } from '../util/index'

// 初始化mixin静态方法
export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
