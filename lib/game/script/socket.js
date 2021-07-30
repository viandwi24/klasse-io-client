import { ref } from '@nuxtjs/composition-api'
import { Socket } from '~/lib/socket'

export {
  Socket
}

export function useSocket() {
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
