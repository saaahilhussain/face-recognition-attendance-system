let ioInstance = null
const socketState = {
  connectedClients: 0,
  lastEvent: null,
}

export function setSocketServer(io) {
  ioInstance = io
}

export function setConnectedClientCount(count) {
  socketState.connectedClients = count
}

export function emitSocketEvent(eventName, payload) {
  if (!ioInstance) {
    return
  }

  const eventPayload = {
    ...payload,
    event: eventName,
    timestamp: payload?.timestamp || new Date().toISOString(),
  }

  socketState.lastEvent = {
    event: eventName,
    timestamp: eventPayload.timestamp,
  }

  ioInstance.emit(eventName, eventPayload)
}

export function getSocketStatus() {
  return {
    ready: Boolean(ioInstance),
    connectedClients: socketState.connectedClients,
    lastEvent: socketState.lastEvent,
  }
}
