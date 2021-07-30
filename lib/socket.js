import Peer from 'peerjs';

export {
  Peer
}

export class Socket {
  options = {
    showServerDebug: true,
    socket: "ws://fast-shelf-36952.herokuapp.com",
    peer: {
      host: '54.169.221.249',
      port: 9000,
      path: '/'
    },
  }

  signalClient = null
  localStream = null
  remoteSteam = []

  peerConnection = null
  peers = []

  state = 'idle'

  meet = {
    username: '',
    name: '',
    meetId: null,
    peers: [],
    players: [],
  }

  binds = {
    onConnected: [],
    onDisconnected: [],
    onJoined: [],
    onNewClientConnected: [],
    onRetrieveClientList: [],
    onStateChange: []
  }

  constructor(options = {}) {
    this.options = Object.assign(this.options, options)
    this.signalClient = require('socket.io-client')(this.options.socket)
    this.bindSignalClient()
    this.serverResponse('connecting to server...')
    this.changeState('connecting')
  }



  addBind(listener, fn) {
    this.binds[listener].push(fn)
  }

  changeState(state) {
    this.state = state
    this.runBindFunctions('onStateChange')
  }

  async runBindFunctions(listener) {
    const binds = this.binds[listener]
    for (let i = 0; i < binds.length; i++) {
      const fn = binds[i];
      const context = {
        signalClient: this.signalClient,
        peerConnection: this.peerConnection,
        localStream: this.localStream,
        remoteSteam: this.remoteSteam,
        state: this.state,
        meet: this.meet
      }
      await fn(context)
    }
  }

  serverResponse(data) {
    if (this.options.showServerDebug) console.log(`[server] : ${data}`)
  }

  joinMeet(meetId, username) {
    if (this.state !== 'connected') return
    this.serverResponse('joining...')
    this.changeState('joining')
    this.meet = {
      username,
      meetId
    }
    this.signalClient.emit('join', {
      meetId,
      username,
    })
  }

  onSocketConnected() {
    // const fakeStream = new MediaStream()
    // const fakeStream = this.localStream
    this.peerConnection = new Peer(this.signalClient.id, this.options.peer)
    this.peerConnection.on('connection', (conn) => {
      conn.on('data', (data) => {
        console.log(data)
      })
    })
    this.peerConnection.on('call', (call) => {
      call.answer(this.localStream)
      console.log('menjawab ', call.peer)
    })
  }

  send(key, params) {
    const data = {
      meetId: this.meet.meetId,
    }
    this.signalClient.emit(key, Object.assign(data, params))
  }

  bindSignalClient() {
    const socket = this.signalClient
    socket.on("connect", async () => {
      this.onSocketConnected()
      await this.runBindFunctions('onConnected')
      this.serverResponse(`connected to server with id ${socket.id}`)
      this.changeState('connected')
    })
    socket.on("disconnect", async () => {
      await this.runBindFunctions('onDisconnected')
      this.serverResponse('disconnected from server')
      this.changeState('disconnected')
    })
    socket.on("joined", async (data) => {
      await this.runBindFunctions('onJoined')
      this.meet.meetId = data.id
      this.meet.name = data.name
      this.serverResponse('joined')
      this.changeState('joined')
    })
    socket.on("client-connected", async (data) => {
      if (data === socket.id) return
      await this.runBindFunctions('onNewClientConnected')
     this.serverResponse(`new client connected : ${data}`)
    })
    socket.on("client-list", async (data) => {
      await this.runBindFunctions('onRetrieveClientList')
      try {
        this.meet.players = Array.from(data.clientList)
      } catch (error) {
        this.meet.players = []
      }
    })
    this.signalClient = socket
  }
}
