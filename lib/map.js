export class MapObject {
  constructor (object) {
    this.id = object.id
    this.asset = object.asset
    this.data = object.data
    this.opacity = object.opacity
    this.index = object.index
  }

  /**
   * Set data
   *
   * @param  {object} newData
   */
  setData(newData) {
    this.data = Object.assign(this.data, newData)
  }

  /**
   * Get data
   */
  getData() {
    return this.data
  }
}

export class Map {
  objects = []
  layersSorted = []
  template = {
    name: '',
    description: '',
    author: '',
    assets: [],
    size: {
      width: 0,
      height: 0
    },
    pixel: {
      width: 0,
      height: 0
    },
    layers: [],
  }

  /**
   * Create new instance of map
   *
   * @param  {} vueContext
   * @param  {} resourceManager
   */
  constructor (vueContext, resourceManager) {
    this.vueContext = vueContext
    this.resourceManager = resourceManager
  }

  /**
   * Load template from JSON with http request
   *
   * @param  {string} url
   */
  async loadFromHttp (url) {
    try {
      const { $axios } = this.vueContext

      // get template from url
      const result = await $axios.get(url)
      this.template = result.data

      // load assets in templates
      await this.loadAssets()

      // // sorted layers
      this.layersSorted = this.template.layers.sort((a, b) => a.index - b.index)

      // // register object from layers
      this.registerObjects()

      // return success
      return true
    } catch {
      console.log('cannt load map from url:', url)
      return false
    }
  }

  /**
   * Load asstes from template
   */
  async loadAssets () {
    const assets = this.template.assets
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i]
      const options = (typeof asset.options !== 'undefined') ? asset.options : {}
      if (typeof options.source === 'undefined') options.source = this.getOriginalPixelSize()
      this.resourceManager.add(asset.type, asset.name, asset.url, options)
    }
    await this.resourceManager.load()
  }

  /**
   * Register objects from layers
   */
  registerObjects() {
    const objectNameTaked = {}
    for (let i = 0; i < this.layersSorted.length; i++) {
      const layer = this.layersSorted[i]
      // object loop
      for (let j = 0; j < layer.objects.length; j++) {
        const object = layer.objects[j]
        // data loop
        for (let k = 0; k < object.data.length; k++) {
          const data = object.data[k]
          const objectInfo = {
            id: '',
            data,
            node: object,
            layer: object.asset,
            asset: this.resourceManager.get(object.asset),
          }

          // random id
          if (typeof data.objectID !== 'undefined') {
            objectInfo.id = data.objectID
          } else {
            objectInfo.id = objectInfo.node.asset
            if (typeof objectNameTaked[objectInfo.id] !== 'undefined') {
              objectNameTaked[objectInfo.id] = objectNameTaked[objectInfo.id] + 1
              objectInfo.id = objectInfo.id + '_' + (objectNameTaked[objectInfo.id]-1)
            } else {
              objectNameTaked[objectInfo.id] = 1
            }
          }

          // build size and position
          const mapOriginalPixelSize = this.getOriginalPixelSize()
          data.x = (data.x || 0)
          data.y = (data.y || 0)
          data.width = (data.width || objectInfo.asset.options.pixel?.width || mapOriginalPixelSize.width)
          data.height = (data.height || objectInfo.asset.options.pixel?.height || mapOriginalPixelSize.height)

          // adding object
          this.objects.push(
            new MapObject({
              id: objectInfo.id,
              data: objectInfo.data,
              asset: objectInfo.asset,
              opacity: layer.opacity || 1,
              index: layer.index || 1,
            })
          )
        }
      }
    }
  }

  /**
   * Add object to map
   *
   * @param  {string} id
   * @param  {string} data
   * @param  {object} asset
   * @param  {number} opacity=1
   * @param  {number} index=1
   */
  addObject (id, data, asset, index = 1, opacity = 1) {
    // adding object
    this.objects.push(
      new MapObject({
        id,
        data,
        asset,
        opacity,
        index,
      })
    )
    return this.getObject(id)
  }

  /**
   * Get object with id
   *
   * @param  {string} id
   */
  getObject(id) {
    return this.objects.find(e => e.id === id)
  }

  /**
   * Draw map
   *
   * @param  {} context
   */
  draw (context) {
    // vars
    const { screen } = context
    const objects = this.objects
    const sortedObjects = objects.sort((a, b) => a.index - b.index)

    // clear screen
    // screen.clear()

    // draw object
    for (let i = 0; i < sortedObjects.length; i++) {
      const object = objects[i]
      screen.drawObject(context, object)
    }

    // map accessable border
    const gameSize = this.getOriginalGameSize()
    screen.draw(context, 0, 0, gameSize.width, gameSize.height, this.pixel, (ctx, x, y, w, h) => {
      ctx.beginPath()
      ctx.strokeStyle = "red";
      ctx.rect(x, y, w, h)
      ctx.stroke()
    })
  }

  /**
   * Get original pixel size
   */
  getOriginalPixelSize () {
    return this.template.pixel
  }

  getOriginalGameSize () {
    return this.template.size
  }
}
