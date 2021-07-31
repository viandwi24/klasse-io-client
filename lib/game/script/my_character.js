import { RESOURCE } from '~/lib/game'

export {
  RESOURCE
}

export async function useMyCharacter(game, socket, data) {
  // options
  const options = { showRadius: false }

  // resource
  game.resourceManager.add(
    RESOURCE.SPRITE,
    'character_femalestaffdark_yellow',
    '/characters/femalestaffdark_yellow.png'
  )
  await game.resourceManager.load()
  const characterResource = game.resourceManager.get('character_femalestaffdark_yellow')

  // state
  const state = {
    direction: 'bottom',
    scene: 0,
    x: data.x || game.map.getCharacterSpawn().x || 0,
    y: data.y || game.map.getCharacterSpawn().y || 0,
    frameCycle: 0,
    cycleChar: [0, 0, 0],
    keysMap: [],
  }

  // add object
  game.map.offset = {
    x: ((game.canvas.width / 2) - game.map.tileSize.width) - state.x,
    y: ((game.canvas.height / 2) - game.map.tileSize.height) - state.y,
  }
  game.map.addObject(
    'my_character',
    state,
    (context, object, state) => {
      // UPDATE LOGIC
      const { map } = context
      const { keysMap,  x, y } = state
      // const { offset } = map
      let { cycleChar, direction } = state
      const speed = game.options.character.speed
      if (keysMap.length === 0 || !keysMap.find(e => e === true)) {
        if (direction === 'bottom') {
          cycleChar = [0, 0, 0]
        } else if (direction === 'left') {
          cycleChar = [3, 3, 3]
        } else if (direction === 'up') {
          cycleChar = [6, 6, 6]
        } else if (direction === 'right') {
          cycleChar = [9, 9, 9]
        }
        state.cycleChar = cycleChar
      } else {
        const w = map.tileSize.width * map.tileOutputSize
        const h = map.tileSize.height * map.tileOutputSize
        let ax = x
        let ay = y
        if (keysMap[68] === true) {
          // right
          direction = 'right'
          cycleChar = [9, 10, 11]
          ax += speed
        } else if (keysMap[87] === true) {
          // up
          direction = 'up'
          cycleChar = [6, 7, 8]
          ay -= speed
        } else if (keysMap[65] === true) {
          // left
          direction = 'left'
          cycleChar = [3, 4, 5]
          ax -= speed
        } else if (keysMap[83] === true) {
          // bottom
          direction = 'bottom'
          cycleChar = [0, 1, 2]
          ay += speed
        }
        // ax = Math.floor(ax)
        // ay = Math.floor(ay)
        game.map.offset = {
          x: ((game.canvas.width / 2) - game.map.tileSize.width) - ax,
          y: ((game.canvas.height / 2) - game.map.tileSize.height) - ay,
        }

        // collision
        const a = map.checkCollision(ax, ay, w, h)
        if (a) return

        // set state
        state.cycleChar = cycleChar
        object.setState({ x: ax, y: ay, direction })

        // send to server
        socket.send('player-action', {
          action: 'move',
          data: { x: ax, y: ay, direction }
        })
      }
    }, (context, object, state) => {
      // RENDER LOGIC
      const { canvasContext: ctx, map, frame } = context
      const { cycleChar } = state
      const scene = cycleChar[state.frameCycle]

      //
      const x = state.x + map.offset.x
      const y = state.y + map.offset.y
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

      //
      if (options.showRadius) {
        const radiusView = 100
        const circle = {
          x: x + (w/2),
          y: y + (h/2)
        }

        ctx.beginPath();
        ctx.strokeStyle = 'blue'
        ctx.arc(circle.x, circle.y, radiusView, 0, 2 * Math.PI);
        ctx.stroke()
      }

      // frame
      if (frame % 10 === 0) {
        if (state.frameCycle >= cycleChar.length-1) state.frameCycle = -1
        state.frameCycle++
      }
    }
  )

  // key binding
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

  // return
  return game
}
