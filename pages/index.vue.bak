<template>
  <div class="screen">
    <canvas id="game" />
  </div>
</template>

<script>
import { defineComponent, onMounted, useContext } from '@nuxtjs/composition-api'
import { ResourceManager } from '../lib/resource'
import { Screen } from '../lib/screen'
import { Game } from '../lib/game'
import { useFps } from '../lib/game/plugins/fps'
import { Map } from '../lib/map'

export default defineComponent({
  setup () {
    const { gameInit } = useGame('canvas#game')

    // lifecycle
    onMounted(async () => await gameInit())

    // return
    return {}
  }
})

function useGame (canvasQuerySelector) {
  // vars
  const { myCharacterInit, myCharacterUpdate } = useCharacterControl()
  const vueContext = useContext()

  // game options
  const options = { fps: 60, targetPixel: { width: 128, height: 128 } }

  // update game per frame
  const update = (context) => {
    const { map, applyPlugins, screen } = context

    // logic update
    myCharacterUpdate(context)

    // clear
    screen.clear()

    // draw
    map.draw(context)

    // game plugins
    applyPlugins(context)
  }

  //
  const onWindowRezise = function () {
    const c = document.querySelector(canvasQuerySelector)
    c.width = c.clientWidth
    c.height = c.clientHeight
  }

  const init = async function () {
    // console.clear()
    // canvas
    window.addEventListener("resize", onWindowRezise)
    onWindowRezise()

    // prepare
    const resourceManager = new ResourceManager()
    const screen = new Screen(document.querySelector(canvasQuerySelector))
    await resourceManager.load()


    // load map
    const map = new Map(vueContext, resourceManager)
    await map.loadFromHttp('maps/example_public_map.json')

    // characters init
    myCharacterInit(resourceManager, map, screen)

    // create game instance
    const gamePlugins = [ useFps ]
    const game = new Game(screen, map, update, options, gamePlugins)
    screen.setTargetPixel(options.targetPixel)
    game.start()

    // focus
    screen.focus('my_character')
  }

  // return
  return {
    gameInit: init,
  }
}

function useCharacterControl () {
  // vars
  let cycleChar = []
  let frameCycle = 0
  const speed = 3

  // my character init
  const myCharacterInit = async (resourceManager, map, screen) =>  {
    // add character
    resourceManager.add(
        "sprite",
        "my_character",
        "characters/cute_male.png",
        {
          source: {
            width: 128,
            height: 128
          }
        }
      )
    await resourceManager.load()
    const characterAsset = resourceManager.get('my_character')
    map.addObject(
      'my_character',
      { x: 0, y: 0, width: 128, height: 128, keysMap: [] },
      characterAsset,
      99
    )

    // bind control
    const keysMap = []
    document.addEventListener('keydown', (e) => {
      const character = map.getObject('my_character')
      keysMap[e.keyCode] = true
      character.setData({ keysMap })
    })
    document.addEventListener('keyup', (e) => {
      const character = map.getObject('my_character')
      keysMap[e.keyCode] = false
      character.setData({ keysMap })
    })
  }

  // my character update
  const myCharacterUpdate = (context) => {
    const { map, frame } = context
    const char = map.getObject('my_character')
    const charData = char.data
    // const velocity = 15

    //
    const keysMap = charData.keysMap

    // iddle
    if (keysMap.length === 0 || !keysMap.find(e => e === true)) {
      cycleChar = [0, 1]
    } else {
      let x = charData.x
      let y = charData.y
      const charSize = charData
      const mapSize = map.getOriginalGameSize()
      if (keysMap[68] === true) {
        // right
        cycleChar = [2, 3]
        x += speed
      } else if (keysMap[87] === true) {
        // up
        cycleChar = [2, 3]
        y -= speed
      } else if (keysMap[65] === true) {
        // left
        cycleChar = [4, 5]
        x -= speed
      } else if (keysMap[83] === true) {
        // bottom
        cycleChar = [8, 9]
        y += speed
      }
      if (x < 0) x = 0
      if (y < 0) y = 0
      if (x + charSize.width >= mapSize.width) x = mapSize.width - charSize.width
      if (y + charSize.height >= mapSize.height) y = mapSize.height - charSize.height
      char.setData({ x, y })
    }

    // apply cycle
    char.asset.scene = cycleChar[frameCycle]

    if (frame % 30 === 0) {
      if (frameCycle >= cycleChar.length-1) frameCycle = -1
      frameCycle++
    }
  }

  return {
    myCharacterInit,
    myCharacterUpdate
  }
}
</script>
