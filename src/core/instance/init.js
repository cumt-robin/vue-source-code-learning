/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++ // uid从0开始

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      // 标记根据uid唯一命名
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      // 在Vue实例化开始时打一个标记
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation 优化内置组件实例化，在src\core\vdom\create-component.js有设置这个，暂时还不清楚细节，留个疑问
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment. 这是因为动态合并options速度相当慢，而且内置组件也不需要特别的处理
      initInternalComponent(vm, options)
    } else {
      // 合并options，并挂载到实例的$options
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // 开发环境调用initProxy，用于进行一些API提示，比如说开发者使用了不存在的属性或方法
      initProxy(vm)
    } else {
      // 生产环境给_renderProxy赋值，不知道具体用意，留个疑问
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    // 初始化生命周期
    initLifecycle(vm)
    // 初始化事件总线
    initEvents(vm)
    // 初始渲染
    initRender(vm)
    // 调用beforeCreate钩子
    callHook(vm, 'beforeCreate')
    // 初始化inject
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    // 初始化provide
    initProvide(vm) // resolve provide after data/props
    // 调用created钩子
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      // 格式化组件名
      vm._name = formatComponentName(vm, false)
      // performance结束标记
      mark(endTag)
      // 测量从初始化开始到created钩子调用后，这段时间的性能
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      // 如果指定了挂载点el，则调用$mount进行挂载，否则需要自己手动调用
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

// 解析构造器选项
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    // 如果有超类，递归解析得到超类构造器选项
    const superOptions = resolveConstructorOptions(Ctor.super)
    
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      // 第一次没有superOptions，直接赋值
      // 后续调用resolveConstructorOptions时如果发现不相等了，说明超类的options变了
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      // 把变化的那部分options取出来
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        // 如果有变化，修改extendOptions，global-api/extend有用到了extendOptions，不知道作用，先留个疑问。
        extend(Ctor.extendOptions, modifiedOptions)
      }
      // 最后基于superOptions扩展extendOptions，作为options的值
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        // 如果options有name属性，把components对象上添加该组件
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
