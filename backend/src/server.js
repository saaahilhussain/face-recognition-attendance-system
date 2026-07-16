import http from 'http'
import app from './app.js'
import { connectDatabase } from './config/database.js'
import { configureSocket } from './socket/index.js'

const port = process.env.PORT || 5000
const server = http.createServer(app)

configureSocket(server)

await connectDatabase()

server.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`)
})
