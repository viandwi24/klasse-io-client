import { ref } from '@nuxtjs/composition-api'

export function useUpdatePlayers(game, socket, players) {
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
