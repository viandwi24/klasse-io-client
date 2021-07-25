const buildImageSize = function (image) {
  return {
    width: image.width,
    height: image.height,
  }
}

export class Sprite {
  constructor (resource) {
    this.type = resource.type
    this.name = resource.name
    this.image = resource.image
    this.imageSize = buildImageSize(this.image)
    this.sourceSize = resource.options.source
    this.options = resource.options
    this.resource = resource
    this.scene = 0
  }

  /**
   * @param  {object} context
   * @param  {object} object
   * @param  {number} x=0
   * @param  {number} y=0
   * @param  {number} width=0
   * @param  {number} height=0
   */
  draw(context, object, x = 0, y = 0, width = 0, height = 0 ) {
    const { screen } = context
    const { asset } = object
    const sourceWidth = this.sourceSize.width
    const sourceHeight = this.sourceSize.height
    const sourceX = (sourceWidth * this.scene)
    const sourceY = 0
    screen.drawSprite(
      asset.image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      x, y, width, height
    )
  }
}

export class Tile {
  constructor (resource) {
    this.type = resource.type
    this.name = resource.name
    this.image = resource.image
    this.imageSize = buildImageSize(this.image)
    this.options = resource.options
    this.resource = resource
  }

  /**
   * @param  {object} context
   * @param  {object} object
   * @param  {number} x=0
   * @param  {number} y=0
   * @param  {number} width=0
   * @param  {number} height=0
   */
  draw(context, object, x = 0, y = 0, width = 0, height = 0 ) {
    const { screen } = context
    const { asset } = object
    screen.drawTile(
      asset.image,
      x, y, width, height
    )
  }
}

export class ResourceManager {
  queueResources = []
  resources = []

  /**
   * add a resource to the queue
   *
   * @param  {string} type
   * @param  {string} name
   * @param  {string} url
   * @param  {object} options={}
   */
  add (type, name, url, options = {}) {
    const image = new Image
    const data = {
      type,
      name,
      url,
      options,
      image,
      loaded: false,
      error: false,
    }
    this.queueResources.push(data)
  }

  /**
   * Load all resources in the queue
   */
  async load() {
    // load all resource in waiting queue
    for (let i = 0; i < this.queueResources.length; i++) {
      const resource = this.queueResources[i]
      const loagResource = () => new Promise((resolve, reject) => {
        resource.image.onload = () => {
          resource.loaded = true
          resolve()
        }
        resource.image.onerror = () => {
          resource.error = true
          resolve()
        }
        resource.image.src = resource.url
      })
      await loagResource()
    }

    // remove all resource in waiting queue
    const loadedResources = [...this.queueResources.filter(e => e.loaded)]
    const errorSprites = [...this.queueResources.filter(e => e.error)]
    this.queueResources = []

    // build resource from loaded resources
    for (let i = 0; i < loadedResources.length; i++) {
      const resource = loadedResources[i]
      let build
      if (resource.type === 'sprite') {
        build = new Sprite(resource)
      } else if (resource.type === 'tile') {
        build = new Tile(resource)
      }
      if (build) {
        this.resources.push(build)
      }
    }

    // return
    return {
      loaded: loadedResources,
      error: errorSprites,
    }
  }

  /**
   * Get resource by name
   *
   * @param  {} name
   */
  get = (name) => this.resources.find(e => e.name === name)

  /**
   * Get all resources
   */
  getResources = () => this.resources
}
