import { ResourceManager, RESOURCE } from './resource'
import { Map } from './map'

// export
export { ResourceManager, RESOURCE }

// default gane options
export const GameDefaultOptions = {
  fps: 30,
  character: {
    speed: 3,
  },
}

/**
 * Create a new game
 * @class Game
 */
export class Game {
  animationFrame = undefined
  frameIndex = 0
  timeThen = undefined
  timeNow = undefined
  timeBefore = 0
  fpsInterval = 0

  /**
   * Create a new game
   * @param  {HTMLCanvasElement} canvas
   * @param  {GameDefaultOptions} options={}
   */
  constructor(canvas, vue, options = {}, plugins = []) {
    this.canvas = canvas
    this.vue = vue
    this.ctx = canvas.getContext('2d')
    this.options = Object.assign(GameDefaultOptions, options)
    this.plugins = plugins
    this.updateFunctions = []

    this.resourceManager = new ResourceManager(this)
    this.map = new Map(this)
  }

  /**
   * Bind a function to update
   * @param  {Function} Update function
   */
  bindUpdate(fn = () => {}) {
    this.updateFunctions.push(fn)
    return this
  }

  /**
   * Start game
   * @return {void}
   */
  start() {
    this.fpsInterval = 1000 / this.options.fps
    this.timeThen = Date.now()
    this.startTime = this.timeThen
    this.animationFrame = requestAnimationFrame(this.update.bind(this))

    // start plugin
    this.plugin({
      plugins: this.plugins,
      map: this.map,
      resourceManager: this.resourceManager,
      canvas: this.canvas,
      canvasContext: this.ctx,
      options: this.options,
    }, this.plugins, 'start')
  }

  /**
   * Stop game
   * @return {void}
   */
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = undefined
    }

    // stop plugin
    this.plugin({
      plugins: this.plugins,
      map: this.map,
      resourceManager: this.resourceManager,
      canvas: this.canvas,
      canvasContext: this.ctx,
      options: this.options,
    }, this.plugins, 'start')
  }

  /**
   * @param  {object} context
   * @param  {Array} plugins=[]
   * @param  {Function} fn=undefined
   */
  plugin(context, plugins = [], fn = undefined) {
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i]
      if (fn) {
        plugin(context)[fn](context)
      } else {
        plugin(context)
      }
    }
  }

  /**
   * Update function
   */
  async update(timestamp) {
    this.animationFrame = requestAnimationFrame(this.update.bind(this))

    // frame
    this.timeNow = Date.now()
    const elapsed = this.timeNow - this.timeThen
    const timePerFrame = ((this.timeNow - this.timeBefore) / 1000)
    // const relativeProgress = runtime / this.duration;

    // request
    if (elapsed > this.fpsInterval) {
      const sinceStart = this.timeNow - this.startTime
      const currentFps = Math.round(Math.round((1000 / (sinceStart / this.frameIndex)) * 100) / 100)
      this.timeThen = this.timeNow - (elapsed % this.fpsInterval);

      // update function
      const context = {
        vue: this.vue,
        plugins: this.plugins,
        map: this.map,
        resourceManager: this.resourceManager,
        canvas: this.canvas,
        canvasContext: this.ctx,
        ctx: this.ctx,
        options: this.options,
        frame: this.frameIndex,
        fps: currentFps,
        startTime: this.startTime,
        timeStart: this.timeStart,
        timeNow: this.timeNow,
        timeThen: this.timeThen,
        sinceStart,
        timePerFrame,
        timestamp,
        applyPlugins: (context, fn = undefined) => {
          const { plugins } = context
          this.plugin(context, plugins, fn)
        }
      }

      //
      for (let i = 0; i < this.updateFunctions.length; i++) {
        const fn = this.updateFunctions[i];
        await fn(context)
      }

      //
      this.frameIndex++
      this.timeBefore = this.timeNow
    }
  }
}
