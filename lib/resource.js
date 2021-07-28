export const RESOURCE = {
  IMAGE: 'image',
  SPRITE: 'sprite',
  TILESET: 'tileset',
}

/**
 * Create a resource manager
 * @class ResourceManager
 */
export class ResourceManager {

  /**
   * create a resource manager
   * @param  {Game} game={}
   */
  constructor(game) {
    this.game = game
    this.queueResources = []
    this.resources = []
  }

  /**
   * Add a resource to the manager
   * @param  {RESOURCE} type=RESOURCE.IMAGE
   * @param  {string} key
   * @param  {string} url
   * @param  {object} options={}
   */
  add(type = RESOURCE.IMAGE, key, url, options = {}) {
    this.queueResources.push({
      type,
      key,
      url,
      options
    })
  }

  /**
   * Load all resources in the queue
   */
  async load() {
    // const proccesedResources = []
    // load all resource in waiting queue
    for (let i = 0; i < this.queueResources.length; i++) {
      const resource = this.queueResources[i]
      let loadResource = () => new Promise((resolve, reject) => resolve())

      //
      if (resource.type === RESOURCE.IMAGE || resource.type === RESOURCE.SPRITE || resource.type === RESOURCE.TILESET) {
        loadResource = () => new Promise((resolve, reject) => {
          resource.image = new Image()
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
      }
      await loadResource()
    }

    //
    const loadedResources = [...this.queueResources.filter(e => e.loaded)]
    const errorResources = [...this.queueResources.filter(e => e.error)]
    this.queueResources = []

    //
    for (let i = 0; i < loadedResources.length; i++) {
      const resource = loadedResources[i]
      if (resource.type === RESOURCE.IMAGE) this.resources.push(new ResourceImage(resource))
      if (resource.type === RESOURCE.SPRITE) this.resources.push(new ResourceSprite(resource))
      if (resource.type === RESOURCE.TILESET) this.resources.push(new ResourceTileset(resource))
    }

    // return
    return {
      loaded: loadedResources,
      error: errorResources,
    }
  }

  /**
   * Get resource by key
   *
   * @param  {string} key
   */
   get = (key) => this.resources.find(e => e.key === key)
}


/**
 * Create a resource
 * @class Resource
 */
export class Resource {

  /**
   * @param  {object} resource
   */
  constructor(resource) {
    this.key = resource.key
    this.resource = resource
  }
}

/**
 * Create a resource image
 * @class ResourceImage
 */
export class ResourceImage extends Resource {
  constructor(resource) {
    super(...arguments)
    this.image = resource.image
  }
}

/**
 * Create a resource Sprite
 * @class ResourceSprite
 */
export class ResourceSprite extends Resource {
  constructor(resource) {
    super(...arguments)
    this.image = resource.image
  }
}

/**
 * Create a resource Tileset
 * @class ResourceTileset
 */
export class ResourceTileset extends Resource {
  constructor(resource) {
    super(...arguments)
    this.image = resource.image
  }
}
