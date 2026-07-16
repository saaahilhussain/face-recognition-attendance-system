let ioInstance = null

export function setSocketServer(io) {
  ioInstance = io
}

export function emitSocketEvent(eventName, payload) {
  if (!ioInstance) {
    return
  }

  ioInstance.emit(eventName, payload)
}
