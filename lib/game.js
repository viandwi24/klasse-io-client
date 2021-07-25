export const defaultOptions = {
  fps: 15,
}


export class Game {
  frameIndex = 0
  timeThen = undefined
  timeNow = undefined
  fpsInterval = 0

  /**
   * Create new game instance
   *
   * @param  {object} screen
   * @param  {object} map
   * @param  {VoidFunction} updateFn=()
   * @param  {} options={}
   */
  constructor(screen, map, updateFn = () => {}, options = {}, plugins = []) {
    this.screen = screen
    this.map = map
    this.updateFn = updateFn
    this.options = Object.assign(defaultOptions, options)
    this.animationFrame = undefined
    this.plugins = plugins
  }

  /**
   * Start game
   */
  start() {
    this.fpsInterval = 1000 / this.options.fps
    this.timeThen = Date.now()
    this.startTime = this.timeThen
    this.animationFrame = requestAnimationFrame(this.update.bind(this))
  }


  /**
   * Stop game
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
      const currentFps = Math.floor(Math.round((1000 / (sinceStart / this.frameIndex)) * 100) / 100)
      this.timeThen = this.timeNow - (elapsed % this.fpsInterval);

      // update function
      const context = {
        screen: this.screen,
        map: this.map,
        gameOptions: this.options,
        frame: this.frameIndex,
        fps: currentFps,
        timeStart: this.timeStart,
        timeNow: this.timeNow,
        timeThen: this.timeThen,
        plugins: this.plugins,
        applyPlugins: (context) => {
          const { plugins } = context
          for (let i = 0; i < plugins.length; i++) {
            const plugin = plugins[i]
            plugin(context)
          }
        }
      }
      this.updateFn(context)
      this.frameIndex++
    }
  }
}
