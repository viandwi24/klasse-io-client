import { parseStringPromise } from 'xml2js'
import { RESOURCE } from './resource'

/**
 * Create a map
 * @class Map
 */
export class Map {
  objects = []

  /**
   * create a map
   * @param  {Game} game={}
   */
  constructor(game) {
    this.game = game
    this.mapData = {}
    this.tilesets = []
    this.tileOutputSize = 1
    this.mapTiles = []
    this.a = []
    this.b = []
  }

  /**
   * Draw map
   * @param  {object} context
   */
  draw(context) {
    const { canvasContext: ctx } = context

    // OBJECT: LOGIC
    for (let i = 0; i < this.objects.length; i++) {
      const object = this.objects[i];
      object.update(context, object, object.state)
    }

    // calc
    const tileOutputSize = this.tileOutputSize
    const w = (this.tileSize.width) * tileOutputSize
    const h = (this.tileSize.height) * tileOutputSize

    // clear canvas
    ctx.clearRect(0, 0, context.ctx.canvas.width, context.ctx.canvas.height)

    // display per layer
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i]

      // convert grid to coordinate
      for (let j = 0; j < layer.data.length; j++) {
        const tileId = layer.data[j]
        if (!tileId) continue
        const tileX = j % this.mapSize.width
        const tileY = Math.floor(j / this.mapSize.width)
        const tile = this.mapTiles.find(t => t.id === tileId)
        const x = tileX * w
        const y = tileY * h

        ctx.drawImage(
          tile.resource.image,
          tile.sourceX, tile.sourceY, this.tileSize.width, this.tileSize.height,
          x, y,
          w, h,
        )
        const isACollision = this.mapCollision.find(c => parseInt(c.id) === parseInt(tileId))
        if (isACollision) {
          const cb = isACollision.data
          ctx.beginPath()
          ctx.rect(
            x + cb.x, y + cb.y,
            cb.width, cb.height
          )
          ctx.strokeStyle = 'white'
          ctx.stroke()
        }
      }
    }

    // OBJECT: RENDER
    for (let i = 0; i < this.objects.length; i++) {
      const object = this.objects[i];
      object.render(context, object, object.state)
    }

    // display grid
    // for (let col = 0; col < this.mapSize.height; col++) {
    //   const y = col * w
    //   for (let row = 0; row < this.mapSize.width; row++) {
    //     const x = row * h
    //     ctx.beginPath()
    //     ctx.rect(
    //       x, y,
    //       w, h
    //     )
    //     ctx.strokeStyle = 'white'
    //     ctx.stroke()
    //   }
    // }
  }

  /**
   * Mapping tile set
   */
  mappingTileSet() {
    const { tilesets, game: { resourceManager } } = this
    const mapTiles = []
    const mapCollision = []

    for (let i = 0; i < tilesets.length; i++) {
      const tileset = tilesets[i];
      const firstId = this.mapData.tilesets[i].firstgid
      let idnya = firstId

      // add id
      for (let j = 0; j < tileset.image.length; j++) {
        const image = tileset.image[j].$
        const resource = resourceManager.get(`${tileset.$.name}___${image.source}`)
        const tilesetCol = (image.height / this.tileSize.height)
        const tilesetRow = (image.width / this.tileSize.width)
        for (let k = 0; k < tilesetCol; k++) {
          for (let l = 0; l < tilesetRow; l++) {
            const tileId = idnya
            mapTiles.push({
              id: tileId,
              tileset_name: `${tileset.$.name}___${image.source}`,
              sourceX: (l * this.tileSize.width),
              sourceY: (k * this.tileSize.height),
              col: tilesetCol,
              row: tilesetRow,
              resource,
            })
            idnya++
          }
        }
      }

      // add collider
      for (let j = 0; j < tileset.tile.length; j++) {
        const tile = tileset.tile[j]
        const data = tile.objectgroup[0].object[0].$
        mapCollision.push({
          id: parseInt(tile.$.id)+1,
          data: {
            x: parseInt(data.x),
            y: parseInt(data.y),
            width: parseInt(data.width),
            height: parseInt(data.height),
            id: parseInt(data.id),
          },
        })
      }
    }
    this.mapTiles = mapTiles
    this.mapCollision = mapCollision
  }

  /**
   * Load template from JSON with http request
   * @param   {import('@nuxtjs/axios').NuxtAxiosInstance} $axios
   * @param   {string} url
   * @return  {boolean}
   */
   async loadFromHttp($axios, url) {
    try {
      //
      this.mapUrl = url
      this.mapBaseUrl = url.split('/').slice(0, -1).join('/') + '/'

      // get template from url
      const getMap = await $axios.get(url)
      this.mapData = getMap.data
      this.mapSize = { width: this.mapData.width, height: this.mapData.height }
      this.tileSize = { width: this.mapData.tilewidth, height: this.mapData.tileheight }
      this.layers = this.mapData.layers

      //
      await this.loadTileset($axios)
      await this.loadAllResources()
      await this.mappingTileSet()

      // return success
      return true
    } catch (error) {
      console.log('cannt load map from url:', url)
      console.log(error)
      return false
    }
  }

  /**
   * Load tilesets
   * @param  {import('@nuxtjs/axios').NuxtAxiosInstance} $axios
   */
  async loadTileset($axios) {
    try {
      const tilesetsData = this.mapData.tilesets
      for (let i = 0; i < tilesetsData.length; i++) {
        const item = tilesetsData[i];

        // get template from url
        const getMap = await $axios.get(this.mapBaseUrl + item.source)

        //
        const a = await parseStringPromise(getMap.data)
        this.tilesets.push(a.tileset)
      }
    } catch (error) {
      console.log('cannt load map because tileset cannt load.')
      console.log(error)
      return false
    }
  }

  /**
   * Load Resources
   */
  async loadAllResources() {
    const resourceManager = this.game.resourceManager

    //
    for (let i = 0; i < this.tilesets.length; i++) {
      const tileset = this.tilesets[i];

      // load image in tileset
      for (let j = 0; j < tileset.image.length; j++) {
        const image = tileset.image[j].$;
        resourceManager.add(
          RESOURCE.TILESET,
          `${tileset.$.name}___${image.source}`,
          this.mapBaseUrl + image.source,
          { width: image.width, height: image.height },
        )
      }
    }

    // load
    await resourceManager.load()
  }

  /**
   * Add object to map
   * @param  {string} id
   * @param  {Function} updateFN=() => {}
   * @param  {Function} renderFN=() => {}
   */
  addObject(id, state = {}, updateFN = () => {}, renderFN = () => {}) {
    this.objects.push(new MapObject(id, state, updateFN, renderFN))
  }

  /**
   * Get object with id
   * @param  {string} id
   */
  getObject(id) {
    return this.objects.find(e => e.id === id)
  }


  /**
   * Check collision with map
   * @param  {number} x
   * @param  {number} y
   * @return {boolean}
   */
  checkCollision(aX, aY, aW, aH) {
    let collision = false

    // calc
    const tileOutputSize = this.tileOutputSize
    const bW = (this.tileSize.width) * tileOutputSize
    const bH = (this.tileSize.height) * tileOutputSize
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i]
      // if (layer.name !== 'Table') continue

      // convert grid to coordinate
      for (let j = 0; j < layer.data.length; j++) {
        const tileId = layer.data[j]
        if (!tileId) continue
        const tileRow = j % this.mapSize.width
        const tileCol = Math.floor(j / this.mapSize.width)
        // const tile = this.mapTiles.find(t => t.id === tileId)
        const bX = tileRow * bW
        const bY = tileCol * bH

        //
        const inCollisionMap = this.mapCollision.find(c => c.id === tileId)
        if (inCollisionMap) {
          const cb = inCollisionMap.data
          // ((aX + aW >= bX) && (aX <= bX + bW))
          // && ((aY + aH >= bY) && (aY <= bY + bH))
          if (
            ((aX + aW >= bX + cb.x) && (aX <= bX + cb.x + cb.width))
            && ((aY + aH >= bY + cb.y) && (aY <= bY + cb.y + cb.height))
          ) {
            collision = true
            return true
          }
        }
      }
    }
    return collision
  }
}

/**
 * Create a map object
 * @class MapObject
 */
export class MapObject {
  constructor(id, state = {}, updateFN = () => {}, renderFN = () => {}) {
    this.id = id
    this.state = state
    this.update = updateFN
    this.render = renderFN
  }

  /**
   * Set state
   * @param  {object} newState
   */
  setState(newState) {
    this.state = Object.assign(this.state, newState)
  }

  /**
   * Get data
   */
  getState() {
    return this.state
  }
}
