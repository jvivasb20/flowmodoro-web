let kRestFactor = 4
let isRunning = false
let isResting = false
let intervalId
let elapsedSeconds = 0

const calculateTime = () => {
  const hours = Math.floor(elapsedSeconds / 3600)
  const minutes = Math.floor((elapsedSeconds % 3600) / 60)
  const seconds = elapsedSeconds % 60

  return { hours, minutes, seconds, elapsedSeconds }
}

const startTimer = () => {
  if (!intervalId) {
    intervalId = setInterval(() => {
      elapsedSeconds += isResting ? -1 : 1
      if (elapsedSeconds <= 0) {
        stopTimer()
      } else {
        self.postMessage({ type: 'tick', time: calculateTime(), isResting })
      }
    }, 1000)
  }
}

const stopTimer = () => {
  clearInterval(intervalId)
  intervalId = null
  isRunning = false
  isResting = false
  elapsedSeconds = 0
  self.postMessage({ type: 'stop', time: calculateTime() })
}

self.addEventListener('message', (message) => {
  switch (message.data.type) {
    case 'setSettings':
      kRestFactor = message.data.settings.kRestFactor
      break

    case 'start':
      if (!isRunning && !isResting) {
        isRunning = true
        startTimer()
      }
      break

    case 'resume':
      if (!isRunning) {
        isRunning = true
        isResting = false
        startTimer()
      }
      break

    case 'pause':
      if (isRunning) {
        clearInterval(intervalId)
        intervalId = null
        isRunning = false
        self.postMessage({ type: 'pause' })
      }
      break

    case 'stop':
      if (isResting) {
        stopTimer()
      } else {
        isResting = true
        elapsedSeconds = Math.max(Math.floor(elapsedSeconds / kRestFactor), 3)
        startTimer()
      }
      break

    default:
      console.log('Unknown command:', message.data.type)
      break
  }
})
