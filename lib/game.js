import { ResourceManager, RESOURCE } from './resource'
import { Map } from './map'

// export
export { ResourceManager, RESOURCE }

// default gane options
export const GameDefaultOptions = {
  fps: 60,
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
  fpsInterval = 0

  /**
   * Create a new game
   * @param  {HTMLCanvasElement} canvas
   * @param  {GameDefaultOptions} options={}
   */
  constructor(canvas, options = {}, plugins = []) {
    this.canvas = canvas
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
  }

  /**
   * Update function
   */
  update(timestamp) {
    this.animationFrame = requestAnimationFrame(this.update.bind(this))

    // frame
    this.timeNow = Date.now()
    const elapsed = this.timeNow - this.timeThen
    // const relativeProgress = runtime / this.duration;

    // request
    if (elapsed > this.fpsInterval) {
      const sinceStart = this.timeNow - this.startTime
      const currentFps = Math.round(Math.round((1000 / (sinceStart / this.frameIndex)) * 100) / 100)
      this.timeThen = this.timeNow - (elapsed % this.fpsInterval);

      // update function
      const context = {
        plugins: this.plugins,
        map: this.map,
        resourceManager: this.resourceManager,
        canvasContext: this.ctx,
        options: this.options,
        frame: this.frameIndex,
        fps: currentFps,
        timeStart: this.timeStart,
        timeNow: this.timeNow,
        timeThen: this.timeThen,
        ctx: this.ctx,
        timestamp,
        applyPlugins: (context) => {
          const { plugins } = context
          for (let i = 0; i < plugins.length; i++) {
            const plugin = plugins[i]
            plugin(context)
          }
        }
      }

      //
      for (let i = 0; i < this.updateFunctions.length; i++) {
        const fn = this.updateFunctions[i];
        fn(context)
      }

      //
      this.frameIndex++
    }
  }
}
