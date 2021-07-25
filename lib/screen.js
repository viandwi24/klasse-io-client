export class Screen {
  canvas = document.createElement('canvas')
  ctx = this.canvas.getContext('2d')
  canvasSize = { width: 0, height: 0 }
  focusObjectID = undefined
  focusPos = undefined
  targetPixel = { width: 0, height: 0 }

  /**
   * new Screen
   *
   * @param  {HTMLCanvasElement} canvas
   * @param  {object} gameSize
   */
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = this.canvas.getContext('2d')
    this.canvasSize = {
      width: this.canvas.width,
      height: this.canvas.height
    }
  }

  /**
   * Clear screen
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * Draw with instance canvas
   *
   * @param  {} x
   * @param  {} y
   * @param  {} w
   * @param  {} h
   * @param  {} fn=(
   * @param  {} =>{}
   */
   draw(context, x, y, w, h, size, fn = () => {}) {
     const { map } = context

    // convert map pixel to target pixel
    // const tpSize = this.translatePixel(
    //   context,
    //   { x: w, y: h },
    //   { x: this.targetPixel.width, y: this.targetPixel.height }
    // )
    // w = tpSize.x
    // h = tpSize.y

    // build pos
    if (this.focusObjectID && this.focusPos) {
      const focusObjectData = map.getObject(this.focusObjectID).getData()
      const focusObjectOffset = {
        x: focusObjectData.x,
        y: focusObjectData.y,
      }
      x += this.focusPos.x - focusObjectOffset.x
      y += this.focusPos.y - focusObjectOffset.y
    }
    fn(this.ctx, x, y, w, h)
  }

  /**
   *
   * Draw object
   *
   * @param  {string} object
   */
  drawObject(context, object) {
    const { map } = context
    const { asset, data } = object
    const type = asset.type

    // position and size
    let x = data.x
    let y = data.y
    const w = data.width
    const h = data.height

    // convert map pixel to target pixel
    // const tpSize = this.translatePixel(
    //   context,
    //   { x: w, y: h },
    //   { x: this.targetPixel.width, y: this.targetPixel.height }
    // )
    // const tpPos = this.translatePixel(
    //   context,
    //   { x, y },
    //   { x: this.targetPixel.width, y: this.targetPixel.height }
    // )
    // w = tpSize.x
    // h = tpSize.y
    // x = tpPos.x
    // y = tpPos.y

    // build pos
    const resultPos = this.buildPosObject(object, map, x, y, w, h)
    x = resultPos.x
    y = resultPos.y

    try {
      if (type === 'tile') {
        asset.draw(context, object, x, y, w, h)
      } else if (type === 'sprite') {
        asset.draw(context, object, x, y, w, h)
      }
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * Draw resource as tile
   *
   * @param  {object} resource
   * @param  {number} x
   * @param  {number} y
   * @param  {number} w
   * @param  {number} h
   */
  drawTile(resource, x, y, width, height) {
    this.ctx.drawImage(
      resource,
      x, y, width, height
    )
  }

  /**
   * Draw resource as sprite
   *
   * @param  {object} resource
   * @param  {number} sourceX
   * @param  {number} sourceY
   * @param  {number} sourceWidth
   * @param  {number} sourceHeight
   * @param  {number} x
   * @param  {number} y
   * @param  {number} width
   * @param  {number} height
   */
  drawSprite(resource, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height) {
    this.ctx.drawImage(
      resource,
      sourceX, sourceY, sourceWidth, sourceHeight,
      x, y, width, height
    )
  }

  /**
   * Focus on object
   *
   * @param  {} id
   */
   focus(id) {
    this.focusObjectID = id
  }

  /**
   * Build Posisiton Object
   *
   * @param  {object} object
   * @param  {object} map
   * @param  {number} x
   * @param  {number} y
   * @param  {number} w
   * @param  {number} h
   */
   buildPosObject(object, map, x, y, w, h) {
    if (this.focusObjectID) {
      if (this.focusObjectID === object.id) {
        this.focusPos = {
          x: (this.canvas.width / 2) - (w / 2),
          y: (this.canvas.height / 2) - (h / 2)
        }
        x = this.focusPos.x
        y = this.focusPos.y
      }
      else {
        // eslint-disable-next-line no-lonely-if
        if (this.focusPos) {
          const focusObjectData = map.getObject(this.focusObjectID).getData()
          const focusObjectOffset = {
            x: focusObjectData.x,
            y: focusObjectData.y,
          }
          x += this.focusPos.x - focusObjectOffset.x
          y += this.focusPos.y - focusObjectOffset.y
        }
      }
    }
    return {
      x, y, w, h,
    }
  }


  /**
   * Set Target pixel
   *
   * @param  {x, y} pixel
   */
  setTargetPixel(pixel) {
    this.targetPixel = pixel
  }

  /**
   * Get Target pixel
   *
   * @param  {x, y} pixel
   */
  getTargetPixel() {
    return this.targetPixel
  }

  /**
   * Get target map size
   *
   * @param  {} map
   */
  getMapTargetSize (map) {
    const context =  { map }
    const originalSize = map.getOriginalGameSize()
    const w = originalSize.width
    const h = originalSize.height

    // convert map pixel to target pixel
    const tpSize = this.translatePixel(
      context,
      { x: w, y: h },
      { x: this.targetPixel.width, y: this.targetPixel.height }
    )

    return {
      width: tpSize.x,
      height: tpSize.y,
    }
  }

  /**
   * Get target object size
   *
   * @param  {} map
   * @param  {} object
   */
  getObjectTargetSize (map, object) {
    const context =  { map }
    const data = object.getData()
    const w = data.width
    const h = data.height

    // convert map pixel to target pixel
    const tpSize = this.translatePixel(
      context,
      { x: w, y: h },
      { x: this.targetPixel.width, y: this.targetPixel.height }
    )

    return {
      width: tpSize.x,
      height: tpSize.y,
    }
  }

  /**
   * Translate Pixel
   *
   * @param  {object} context
   * @param  {object} from
   * @param  {object} to
   */
  translatePixel(context, from, to) {
    const { map } = context
    const pixel = map.template.pixel
    return {
      x: (to.x * from.x) / pixel.width,
      y: (to.y * from.y) / pixel.height,
    }
  }
}
