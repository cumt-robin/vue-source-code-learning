/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    // 判断待安装的插件是不是已经存在于自身的插件列表中
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) {
      // 如果插件已经存在了，直接返回this，是为了链式调用吧
      return this
    }

    // Vue.use(plugin, ...args)时可以传参数给插件
    // 这里toArray(arguments, 1)是把plugin剔除，取后面的作为参数
    const args = toArray(arguments, 1)
    // 然后要把Vue注入到插件install方法的参数中
    args.unshift(this)
    // 接着开始执行插件安装初始化方法
    if (typeof plugin.install === 'function') {
      // 标准的插件写法，插件是一个对象，提供一个install方法。install(Vue, ...restArgs)
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      // 如果插件本身是一个函数，也可以不提供install方法
      plugin.apply(null, args)
    }
    // 把这个新插件加入到插件列表中
    installedPlugins.push(plugin)
    // 最后也返回this，可以链式调用
    return this
  }
}
