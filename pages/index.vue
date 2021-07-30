<template>
  <div>
    <div v-if="gameStart" class="screen">
      <canvas id="game" width="800" height="400" />
      <div class="players_cam">
        <div class="players_cam__container">
          <div v-for="(item, i) in registeredPlayer.filter(e => e.peerCall !== undefined)" :key="i" class="players_cam__box">
            <video :id="`player_video_${item.id}`" class="players_cam__video" autoplay="true" />
            <div class="players_cam__name">{{ item.name }}</div>
          </div>
          <!-- <div v-for="(item, i) in 20" :key="i" class="players_cam__box">
            <video :id="`player_video_${item.id}`" class="players_cam__video" autoplay="true" />
            <div class="players_cam__name">{{ i }}</div>
          </div> -->
        </div>
      </div>
      <div class="self_cam">
        <div class="self_cam__container">
          <video id="self_cam__video" autoplay="true" muted />
          <div class="self_cam__toggle">
            <button class="btn btn-sm" :class="{ 'btn-success': !muteAudio, 'btn-danger': muteAudio }" @click="toggleAudio">
              <font-awesome-icon v-if="muteAudio" :icon="['fas', 'microphone-slash']" />
              <font-awesome-icon v-else :icon="['fas', 'microphone']" class="mx-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="screen">
      <div class="h-full flex flex-col justify-center mx-6 md:mx-72 lg:mx-96">
        <div class="container">
          <div class="">
            <div class="card">
              <div class="card-body">
                <div class="form-group mb-3">
                  <label for="inputSelectCamera">Pilih Camera</label>
                  <select id="inputSelectCamera" v-model="selectCamera" class="form-control">
                    <option v-for="(item, i) in cameraDevice" :key="i" :value="i">{{ item.label }}</option>
                  </select>
                </div>
                <div class="form-group mb-3">
                  <label for="inputSelectAudio">Pilih Audio</label>
                  <select id="inputSelectAudio" v-model="selectAudio" class="form-control">
                    <option v-for="(item, i) in audioDevice" :key="i" :value="i">{{ (item.label || 'Default Audio') }}</option>
                  </select>
                </div>
                <div class="form-group mb-3">
                  <label for="inputSelectCamera">Username</label>
                  <input v-model="selectUsername" type="text" class="form-control">
                </div>
                <div class="form-group mb-3">
                  <label for="inputSelectCamera">Pilih Meeting Room</label>
                  <select id="inputSelectCamera" class="form-control">
                    <option v-for="(item, i) in meetings" :key="i" :value="i">{{ item }}</option>
                  </select>
                </div>
                <div class="d-grid">
                  <button class="btn btn-primary" type="button" @click="start">Mulai</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, defineComponent, onBeforeUnmount, onMounted, ref, useContext } from '@nuxtjs/composition-api'
import { Socket } from '../lib/socket'
import { Game, RESOURCE } from '~/lib/game'
import { useFps } from '~/lib/game/plugins/fps'
import { useMapCursorCoordinate } from '~/lib/game/plugins/mapCursorCoordinate'

export default defineComponent({
  setup() {
    const context = useContext()
    const { $axios, $sleep } = context
    const gamePlugins = [useFps, useMapCursorCoordinate]
    const gameStart = ref(false)

    // vars
    const inputDeviceInfo = ref([])
    const cameraDevice = computed(() => inputDeviceInfo.value.filter((e) => e.kind === 'videoinput'))
    const audioDevice = computed(() => inputDeviceInfo.value.filter((e) => e.kind === 'audioinput'))
    const meetings = ref(['public_room'])

    // form
    const muteAudio = ref(false)
    const selectCamera = ref(0)
    const selectAudio = ref(0)
    const selectMeetId = ref('public_demo')
    const selectUsername = ref(`guest_${Math.floor(Math.random() * 100) + 1}`)

    // instance
    let game

    // socket
    const { socket, socketState, socketInit, socketJoinMeet } = useSocket()

    // game
    const players = ref([])
    const { registeredPlayer, playersInit, playersUpdate, playersRender } = useUpdatePlayers(game, socket, players)
    let gamePlayerLocationInit = false
    const gameInit = async (data) => {
      // Create a new game
      const canvasEl = document.querySelector('canvas#game')
      game = new Game(canvasEl, {}, gamePlugins)

      // on window resize
      const onWindowRezise = function () {
        canvasEl.width = canvasEl.clientWidth
        canvasEl.height = canvasEl.clientHeight
      }
      window.addEventListener("resize", onWindowRezise)
      onWindowRezise()

      // load map
      await game.map.loadFromHttp($axios, '/map/demo/demo2.json')

      // add character
      await useMyCharacter(game, socket, data)
      await playersInit(game, socket)


      // bind game update
      game.bindUpdate(gameUpdate)

      // start game
      game.start()
      // console.log(game.map)
    }
    const gameUpdate = (context) => {
      const { map } = context
      // player update logic
      playersUpdate(context)

      // draw
      map.draw(context)

      // player render
      playersRender(context)
    }

    // self cam
    const getMediaDevice = async (device) => {
      inputDeviceInfo.value = await navigator.mediaDevices.enumerateDevices()
    }
    const selfCamInit = async () => {
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        if (navigator.mediaDevices.getUserMedia) {
          const videoConstraint = {
            // width: { min: 1024, ideal: 1280, max: 1920 },
            // height: { min: 776, ideal: 720, max: 1080 },
            deviceId: { exact: cameraDevice.value[selectCamera.value].deviceId  },
          }
          const audioConstraint = {
            deviceId: { exact: audioDevice.value[selectAudio.value].deviceId  },
          }
          try {
            gameStart.value = true
            await $sleep(100)
            const video = document.querySelector('.self_cam .self_cam__container video')
            const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: audioConstraint })
            socket.localStream = stream
            video.srcObject = stream
            // if (video.mozSrcObject !== undefined) {
            //   video.mozSrcObject = stream
            // } else if (video.srcObject !== undefined) {
            //   video.srcObject = stream
            // } else {
            //   video.src = stream
            // }
          } catch (error) {
            gameStart.value = false
            console.log("Something went wrong!");
            console.log(error)
          }
        }
      }
    }
    const start = async () => {
      socket.addBind('onJoined', async () => {
        await selfCamInit()
        // console.log(socket)
      })
      socket.addBind('onRetrieveClientList', async ({ meet }) => {
        players.value = Array.isArray(meet.players) ? meet.players : []
        if (!gamePlayerLocationInit) {
          const a = players.value.find(e => e.id === socket.signalClient.id)
          if (a) {
            gamePlayerLocationInit = true
            await gameInit(a.data)
          }
        }
      })
      socket.addBind('onDisconnected', () => {
        gameStart.value = false
      })
      await socketJoinMeet(selectMeetId.value, selectUsername.value)
    }

    // start the game
    const startGame = async () => await gameInit()

    // lifecylce
    onMounted(async () => {
      await socketInit()
      await getMediaDevice()
      // await $sleep(100)
      // await start()
    })
    onBeforeUnmount(() => {
      if (game) game.stop()
      socket.signalClient.disconnect()
    })

    // return
    return {
      socketState,

      inputDeviceInfo,
      cameraDevice,
      audioDevice,
      meetings,

      players,
      registeredPlayer,

      muteAudio,
      selectCamera,
      selectAudio,
      selectUsername,
      selectMeetId,

      start,
      gameStart,
      startGame,

      toggleAudio: () => {
        muteAudio.value = !muteAudio.value
        socket.localStream.getAudioTracks().forEach((track) => { track.enabled = !track.enabled });
      },
    }
  },
})

function useSocket() {
  const socket = new Socket()
  const socketState = ref('idle')
  socket.addBind('onStateChange', ({ state }) => {
    socketState.value = state
    console.log('state change : ', state)
  })

  const socketInit = () => {
  }
  const socketJoinMeet = async (meetId, name) => {
    await socket.joinMeet(meetId, name)
  }

  return {
    socket,
    socketState,
    socketInit,
    socketJoinMeet,
  }
}

function useUpdatePlayers(game, socket, players) {
  const registeredPlayer = ref([])

  // funcs
  const onPlayerUpdate = (context, object, state) => {
    // const { map } = context
    const { direction } = state
    let { cycleChar } = state

    if (direction === 'bottom') {
      cycleChar = [0, 0, 0]
    } else if (direction === 'left') {
      cycleChar = [3, 3, 3]
    } else if (direction === 'up') {
      cycleChar = [6, 6, 6]
    } else if (direction === 'right') {
      cycleChar = [9, 9, 9]
    }

    //
    // const myChar = map.getObject('my_character')
    // const radiusView = 100
    // const isInside = (circleX, circleY, rad, x, y) => {
    //   if ((x - circleX) * (x - circleX) + (y - circleY) * (y - circleY) <= rad * rad) {
    //     return true
    //   } else {
    //     return false
    //   }
    // }
    // if (isInside(myChar.state.x, myChar.state.y, radiusView, state.x, state.y)) {
    //   if (!state.calling) {
    //     state.calling = true
    //     const peerCall = socket.peerConnection.call(state.id, socket.localStream )
    //     state.player.peerCall = peerCall
    //     peerCall.on('stream', (remoteStream) => {
    //       try {
    //         const videoEl = document.querySelector(`#player_video_${state.id}`)
    //         videoEl.srcObject = remoteStream
    //       } catch (error) {
    //         console.log(error)
    //       }
    //     })
    //   }
    // } else {
    //   // eslint-disable-next-line no-lonely-if
    //   if (state.calling) {
    //     state.calling = false
    //     try { state.player.peerCall.close() } catch (error) {}
    //     state.player.peerCall = undefined
    //   }
    // }

    // s
    object.setState({ cycleChar })
  }
  const onPlayerRender = (context, object, state) => {
      const { canvasContext: ctx, map, resourceManager, frame } = context
      const { cycleChar } = state
      const scene = cycleChar[state.frameCycle]
      const characterResource = resourceManager.get('character_femalestaffdark_yellow')

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

      // adding player name
      const textGap = map.tileSize.width / 2
      ctx.fillStyle = "black";
      ctx.font = "8px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillText(state.name, x + textGap, y - textGap)

      // frame
      if (frame % 15 === 0) {
        if (state.frameCycle >= cycleChar.length-1) state.frameCycle = -1
        state.frameCycle++
      }
  }
  const newPlayerJoin = (context, item) => {
    const { map } = context

    // peer
    const peerCall = socket.peerConnection.call(item.id, socket.localStream)
    peerCall.on('stream', (remoteStream) => {
      try {
        const videoEl = document.querySelector(`#player_video_${item.id}`)
        videoEl.srcObject = remoteStream
        console.log('lagi nelpon')
      } catch (error) {
      }
    })
    // console.log(peer)

    // state
    registeredPlayer.value.push({
      id: item.id,
      name: item.name,
      player: item,
    })
    const player = registeredPlayer.value.find(e => e.id === item.id)
    const state = {
      id: item.id,
      name: item.name,
      frameCycle: 0,
      cycleChar: [0, 0, 0],
      x: item.data.x || 0,
      y: item.data.y || 0,
      direction: item.data.direction,
      player,
      calling: false,
    }


    //
    map.addObject(
      `character_player_${item.id}`,
      state,
      onPlayerUpdate,
      onPlayerRender,
    )
  }
  const playerDisconnect = (context, player) => {
    const { map } = context
    map.deleteObject(`character_player_${player.id}`)
  }

  // lifecycle
  const init = (game, socket) => {
    socket.signalClient.on('player-action', (data) => {
      switch (data.action) {
        case 'move':
          // eslint-disable-next-line no-case-declarations
          const state = data.data || { x: 0, y: 0, direction: 'bottom' }
          // eslint-disable-next-line no-case-declarations
          const object = game.map.getObject(`character_player_${data.id}`)
          if (object) {
            object.setState({ x: state.x, y: state.y, direction: state.direction })
          }
          break;
      }
    })
  }

  const update = (context) => {
    //
    const playerNewJoin = []
    const playerOld = []

    // get players
    const playersWithoutSelf = players.value.filter(e => e.id !== socket.signalClient.id)
    for (let i = 0; i < playersWithoutSelf.length; i++) {
      const searchIndex = registeredPlayer.value.findIndex(e => e.id === playersWithoutSelf[i].id)
      if (searchIndex > -1) {
        const item = registeredPlayer.value[i]
        playerOld.push(item.id)
      } else {
        const item = playersWithoutSelf[i]
        playerNewJoin.push(item.id)
        newPlayerJoin(context, item)
      }
    }

    // remove oldPlayerDisconnected
    for (let i = 0; i < registeredPlayer.value.length; i++) {
      const player = registeredPlayer.value[i]
      if (!playerOld.includes(player.id) && !playerNewJoin.includes(player.id)) {
        playerDisconnect(context, player)
        registeredPlayer.value.splice(i, 1)
      }
    }
  }

  const render = ({ canvas, ctx }) => {
    // render player count
    const gap = 5
    ctx.fillStyle = "red";
    ctx.font = "20px Arial"
    ctx.textBaseline = "bottom"
    ctx.fillText(`Meet : ${socket.meet.name} | Players Online : ${registeredPlayer.value.length+1}`, gap, canvas.height - gap)
  }

  return {
    registeredPlayer,
    playersInit: init,
    playersUpdate: update,
    playersRender: render,
  }
}

async function useMyCharacter(game, socket, data) {
  // options
  const options = { showRadius: true }

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
    // x: (game.canvas.width / 2) - game.map.tileSize.width,
    // y: (game.canvas.height / 2) - game.map.tileSize.height,
    x: data.x || 0,
    y: data.y || 0,
    frameCycle: 0,
    cycleChar: [0, 0, 0],
    keysMap: [],
  }

  // testing
  // game.map.addObject(
  //   'obj_test',
  //   { x: 270, y: 220 },
  //   () => {},
  //   (context, object, state) => {
  //     const { canvasContext: ctx, map } = context
  //     const x = state.x + map.offset.x
  //     const y = state.y + map.offset.y
  //     const w = map.tileSize.width * map.tileOutputSize
  //     const h = map.tileSize.height * map.tileOutputSize
  //     const sY = 0
  //     const sX = 0 * map.tileSize.width
  //     const sW = map.tileSize.width
  //     const sH = map.tileSize.height

  //     // apply cycle
  //     ctx.drawImage(
  //       characterResource.image,
  //       sX, sY, sW, sH,
  //       x, y, w, h
  //     )
  //   }
  // )

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
      if (frame % 15 === 0) {
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
</script>

