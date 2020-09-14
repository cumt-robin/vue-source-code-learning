import { inBrowser } from './env'

export let mark
export let measure

if (process.env.NODE_ENV !== 'production') {
  const perf = inBrowser && window.performance
  /* istanbul ignore if */
  if (
    perf &&
    perf.mark &&
    perf.measure &&
    perf.clearMarks &&
    perf.clearMeasures
  ) {
    // 在performance缓冲区打一个标记
    mark = tag => perf.mark(tag)
    measure = (name, startTag, endTag) => {
      // 创建一个performance实体，用于测量start标记和end标记的性能，需要通过performance.getEntriesByName(name)来获取这个实体
      perf.measure(name, startTag, endTag)
      // 移除标记
      perf.clearMarks(startTag)
      perf.clearMarks(endTag)
      // 此处是Vue源码注释的，clearMeasures是移除measure
      // perf.clearMeasures(name)
    }
  }
}
