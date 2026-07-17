import { Server } from 'socket.io'
import { corsOptions } from '../config/cors.js'
import { setConnectedClientCount, setSocketServer } from './emitter.js'

export function configureSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: corsOptions,
  })

  setSocketServer(io)

  io.on('connection', (socket) => {
    setConnectedClientCount(io.engine.clientsCount)
    console.log(`Socket connected: ${socket.id}`)

    socket.emit('system:ready', {
      service: 'backend',
      timestamp: new Date().toISOString(),
    })

    socket.on('disconnect', (reason) => {
      setConnectedClientCount(io.engine.clientsCount)
      console.log(`Socket disconnected: ${socket.id} (${reason})`)
    })
  })

  return io
}
