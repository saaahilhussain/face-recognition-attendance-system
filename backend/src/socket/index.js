import { Server } from 'socket.io'
import { setSocketServer } from './emitter.js'

export function configureSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  })

  setSocketServer(io)

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    socket.emit('system:ready', {
      service: 'backend',
      timestamp: new Date().toISOString(),
    })

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`)
    })
  })

  return io
}
