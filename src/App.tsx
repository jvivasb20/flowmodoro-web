import {
  Settings,
  PlayCircle,
  StopCircle,
  PauseCircle,
  NotStarted,
  Cancel,
} from '@mui/icons-material'
import { useCallback, useEffect, useState } from 'react'
import type { Time } from './common/types'
import useLocalStorage from './hooks/useLocalStorage'

const stopwatchWorker = new Worker('./stopwatchWorker.ts')

function App() {
  const kIconSize = 96
  const [isRunning, setIsRunning] = useState(false)
  const [isResting, setIsResting] = useState(false)
  const [time, setTime] = useState<Time>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    elapsedSeconds: 0,
  })

  const [settings, setSettings] = useLocalStorage(
    'settings',
    JSON.stringify({ kRestFactor: 4 })
  )

  const postMessage = (type: String, data: object, behavior?: boolean) => {
    return () => {
      stopwatchWorker.postMessage({ type, data })
      if (behavior) setIsRunning(behavior)
    }
  }

  const updateTime = useCallback((time: Time) => setTime(time), [setTime])

  // Send settings to worker when component mounts or settings change
  useEffect(() => {
    stopwatchWorker.postMessage({
      type: 'setSettings',
      settings: settings,
    })
  }, [settings])

  useEffect(() => {
    stopwatchWorker.addEventListener('message', (e) => {
      switch (e.data.type) {
        case 'tick':
          if (e.data.isResting !== isResting) setIsResting(e.data.isResting)

          if (e.data.time.elapsedSeconds === 0) {
            postMessage('stop', {}, false)()
          } else {
            setIsRunning(true)
            updateTime(e.data.time)
          }
          break
        case 'pause':
          setIsRunning(false)
          break
        case 'stop':
          setIsRunning(false)
          updateTime(e.data.time)
          break
        default:
          break
      }
    })
  }, [stopwatchWorker, updateTime, setIsRunning])

  return (
    <div className='flex flex-col w-screen h-screen text-white p-8'>
      <dialog id='settings_modal' className='modal'>
        <div className='modal-box bg-kColorBlack'>
          <div className='modal-action mt-0 mb-8'>
            <form
              method='dialog'
              className='flex flex-row justify-between items-center w-full p-0'>
              <h3 className='font-bold text-lg'>Settings</h3>
              <button className='btn btn-ghost p-0 hover:text-kColorPrimary'>
                <Cancel sx={{ fontSize: kIconSize / 3 }} />
              </button>
            </form>
          </div>
          <div>
            <form method='dialog' className='flex flex-col gap-4'>
              <label className='flex flex-row justify-between items-center'>
                <span>Rest Factor</span>
                <input
                  className='input input-bordered  w-24'
                  type='number'
                  min='1'
                  max='10'
                  defaultValue={settings.kRestFactor}
                  onChange={(e) => {
                    setSettings({ kRestFactor: e.target.valueAsNumber })
                    postMessage('setSettings', settings)
                  }}
                />
              </label>
            </form>
          </div>
        </div>
      </dialog>

      <div className='flex flex-row justify-end'>
        <Settings
          sx={{ fontSize: kIconSize / 2 }}
          className='btn btn-ghost p-0'
          onClick={() => {
            const modal = document.getElementById('settings_modal') as HTMLDialogElement
            modal.showModal()
          }}
        />
      </div>

      <div className='flex flex-row justify-center items-center text-8xl font-bold m-16 h-full'>
        {`${time.hours.toString().padStart(2, '0')}:${time.minutes
          .toString()
          .padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`}
      </div>

      <div className='flex flex-row justify-center items-center gap-8 h-full'>
        {isRunning ? (
          <PauseCircle
            sx={{ fontSize: kIconSize }}
            className='btn btn-ghost p-0 hover:text-kColorPrimary'
            onClick={postMessage('pause', {}, true)}
          />
        ) : time.elapsedSeconds > 0 ? (
          <NotStarted
            sx={{ fontSize: kIconSize }}
            className='btn btn-ghost p-0 hover:text-kColorPrimary'
            onClick={postMessage('resume', {}, true)}
          />
        ) : (
          <PlayCircle
            sx={{ fontSize: kIconSize }}
            className='btn btn-ghost p-0 hover:text-kColorPrimary'
            onClick={postMessage('start', {}, true)}
          />
        )}

        <StopCircle
          sx={{ fontSize: kIconSize }}
          className='btn btn-ghost p-0 hover:text-kColorPrimary'
          onClick={postMessage('stop', {}, isResting ? false : true)}
        />
      </div>
    </div>
  )
}

export default App
