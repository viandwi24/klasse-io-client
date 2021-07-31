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

// scripts
import { useMyCharacter } from '../lib/game/script/my_character'
import { useUpdatePlayers } from '../lib/game/script/players'
import { useSocket } from '../lib/game/script/socket'

// game engine
import { Game } from '~/lib/game'
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
      game = new Game(canvasEl, context, {}, gamePlugins)

      // on window resize
      const onWindowRezise = function () {
        canvasEl.width = canvasEl.clientWidth
        canvasEl.height = canvasEl.clientHeight
      }
      window.addEventListener("resize", onWindowRezise)
      onWindowRezise()

      // load map
      await game.map.loadFromHttp($axios, '/map/demo3/demo3.json')

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
      const { map, ctx } = context
      // player update logic
      playersUpdate(context)

      // clear canvas
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

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
            socket.fakeLocalStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint })
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
      await getMediaDevice()
      await socketInit()
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
</script>

