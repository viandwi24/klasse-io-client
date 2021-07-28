<template>
  <div class="screen">
    <canvas id="game" width="800" height="400" />
  </div>
</template>

<script>
import { defineComponent, onMounted, useContext } from '@nuxtjs/composition-api'
import { Game, RESOURCE } from '~/lib/game'
import { useFps } from '~/lib/game/plugins/fps'

export default defineComponent({
  setup() {
    const { $axios } = useContext()

    // game update
    let a = 2
    const gameUpdate = (context) => {
      const { map, applyPlugins } = context
      if (a === 1) return
      map.draw(context)
      applyPlugins(context)
      a++
    }

    // on mount
    onMounted(async () => {
      // Create a new game
      const canvasEl = document.querySelector('canvas#game')
      const game = new Game(canvasEl, {}, [useFps])

      // on window resize
      const onWindowRezise = function () {
        canvasEl.width = canvasEl.clientWidth
        canvasEl.height = canvasEl.clientHeight
      }
      window.addEventListener("resize", onWindowRezise)
      onWindowRezise()

      // load map
      await game.map.loadFromHttp($axios, '/map/demo/demo2.json')

      // resource
      game.resourceManager.add(
        RESOURCE.SPRITE,
        'character_femalestaffdark_yellow',
        '/characters/femalestaffdark_yellow.png'
      )
      await game.resourceManager.load()

      // add character
      const state = {
        direction: 'bottom',
        scene: 0,
        x: 230,
        y: 220,
        frameCycle: 0,
        cycleChar: [0, 0, 0],
        keysMap: [],
      }
      game.map.addObject('my_character', state, (context, object, state) => {
        // UPDATE LOGIC
        const { map } = context
        const { keysMap, x, y } = state
        let { cycleChar } = state
        const speed = 2.5
        if (keysMap.length === 0 || !keysMap.find(e => e === true)) {
          cycleChar = [0, 0, 0]
          state.cycleChar = cycleChar
        } else {
          const w = map.tileSize.width * map.tileOutputSize
          const h = map.tileSize.height * map.tileOutputSize
          const mapSize = {
            width: (map.tileSize.width * map.mapSize.width),
            height: (map.tileSize.height * map.mapSize.height),
          }
          let ax = x
          let ay = y
          if (keysMap[68] === true) {
            // right
            cycleChar = [9, 10, 11]
            ax += speed
          } else if (keysMap[87] === true) {
            // up
            cycleChar = [6, 7, 8]
            ay -= speed
          } else if (keysMap[65] === true) {
            // left
            cycleChar = [3, 4, 5]
            ax -= speed
          } else if (keysMap[83] === true) {
            // bottom
            cycleChar = [0, 1, 2]
            ay += speed
          }

          // collision
          if (ax < 0) ax = 0
          if (ay < 0) ay = 0
          if (ax + w >= mapSize.width * map.tileOutputSize) ax = mapSize.width * map.tileOutputSize - w
          if (ay + h >= mapSize.height * map.tileOutputSize) ay = mapSize.height * map.tileOutputSize - h
          const a = map.checkCollision(ax, ay, w, h)
          if (a) return

          state.cycleChar = cycleChar
          object.setState({ x:ax, y: ay })
        }
      }, (context, object, state) => {
        // RENDER LOGIC
        const { canvasContext: ctx, map, frame } = context
        const { cycleChar, x, y } = state
        const scene = cycleChar[state.frameCycle]

        //
        const characterResource = game.resourceManager.get('character_femalestaffdark_yellow')
        const w = map.tileSize.width * map.tileOutputSize
        const h = map.tileSize.height * map.tileOutputSize
        const sY = 0
        const sX = scene * map.tileSize.width
        const sW = map.tileSize.width
        const sH = map.tileSize.height

        // apply cycle
        ctx.drawImage(
          characterResource.image,
          sX, sY, sW, sH,
          x, y, w, h
        )

        // frame
        if (frame % 15 === 0) {
          if (state.frameCycle >= cycleChar.length-1) state.frameCycle = -1
          state.frameCycle++
        }
      })
      const keysMap = []
      document.addEventListener('keydown', (e) => {
        const character = game.map.getObject('my_character')
        keysMap[e.keyCode] = true
        character.setState({ keysMap })
      })
      document.addEventListener('keyup', (e) => {
        const character = game.map.getObject('my_character')
        keysMap[e.keyCode] = false
        character.setState({ keysMap })
      })

      // bind game update
      game.bindUpdate(gameUpdate)

      // start game
      game.start()
      console.log(game.map)
    })
    return {}
  },
})
</script>

