import { useEffect, useRef, useState } from 'react'
import './style/player.styl'
import { PLAYMODE, usePlaylist } from './hooks/use-playlist'
import { SERVER_HOST } from './const'
import { useLog } from './hooks/use-log'
import { getSongName } from './utils'

interface PlayerProps {}

const BAR_COUNT = 80

let threshold = 128
let gain = 1.2
const smoothing = 0.2
let smoothedData = new Array(128).fill(0)
let lastBassLevel = 0
let lastBeatTime = 0

const modify = (a: Uint8Array) => {
  return a
  let aa = a
  const b: number[] = []
  const currentMax = Math.max(...aa)
  threshold = threshold * 0.9 + currentMax * 0.1 * 0.6

  const bassData = aa.slice(0, 2) // 前10个bin代表低频
  const bassLevel = bassData.reduce((a, b) => a + b) / bassData.length
  let beatMulti = gain

  // 检测快速上升沿作为节拍
  console.log(bassLevel, lastBassLevel, aa.slice(0, 4))
  if (bassLevel > lastBassLevel * 1.5 && Date.now() - lastBeatTime > 100) {
    lastBeatTime = Date.now()
    console.log('beat', lastBeatTime)
    beatMulti *= 2
  }

  lastBassLevel = bassLevel

  for (let i = 0; i < aa.length; i++) {
    smoothedData[i] = smoothedData[i] * smoothing + aa[i] * (1 - smoothing)
    b[i] = Math.max(0, aa[i] * beatMulti - threshold)
    // b[i] = smoothedData[i]  * beatMulti
  }
  return b
}

export const Player = ({}: PlayerProps) => {
  const ctx = usePlaylist()
  const {
    currentSong,
    playNext,
    currentMode,
    isPlaying,
    setIsPlaying,
    socketOn,
  } = ctx
  const mediaSource = `${SERVER_HOST}/stream` + currentSong
  const [topBars, setTopBars] = useState(Array(BAR_COUNT / 2).fill(0))
  const [bottomBars, setBottomBars] = useState(Array(BAR_COUNT / 2).fill(0))

  const animationRef = useRef(0)
  const sourceRef = useRef<MediaElementAudioSourceNode>(null)
  const audioContextRef = useRef<AudioContext>(null)
  const audioRef = useRef<HTMLVideoElement>(null)
  const analyserRef = useRef<AnalyserNode>(null)
  const dataArrayRef = useRef<Uint8Array>(null)

  const updateWaveform = () => {
    // console.log('analyserRef.current', analyserRef.current)
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current?.getByteFrequencyData?.(dataArrayRef.current)

      // Normalize and scale the data for visualization
      const newTopBars: number[] = []
      const newBottomBars: number[] = []
      const afterArray = modify(dataArrayRef.current)
      const step = Math.floor((afterArray.length ?? 0) / BAR_COUNT)

      for (let i = 0; i < BAR_COUNT; i++) {
        let value = 0
        for (let j = 0; j < step; j++) {
          value += afterArray[i + j] ?? 0
        }
        value = value / step / 255

        if (i % 2 === 1) {
          // if (i > BAR_COUNT / 2) {
          newTopBars.push(value)
        } else {
          newBottomBars.splice(0, 0, value)
        }
      }

      setTopBars(newTopBars)
      setBottomBars(newBottomBars)
      // console.log({ newBars, dataArrayRef })
      animationRef.current = requestAnimationFrame(updateWaveform)
    }
  }

  useEffect(() => {
    let timer = setTimeout(() => {
      if (
        isPlaying &&
        audioContextRef.current &&
        analyserRef.current &&
        audioRef.current
      ) {
        if (sourceRef.current) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = requestAnimationFrame(updateWaveform)
        } else if (
          audioContextRef.current &&
          analyserRef.current &&
          audioRef.current
        ) {
          sourceRef.current =
            sourceRef.current ??
            audioContextRef.current.createMediaElementSource(audioRef.current)
          sourceRef.current.disconnect()
          sourceRef.current.connect(analyserRef.current)
          analyserRef.current.disconnect()
          analyserRef.current.connect(audioContextRef.current.destination)

          dataArrayRef.current = new Uint8Array(
            analyserRef.current.frequencyBinCount
          )
          animationRef.current = requestAnimationFrame(updateWaveform)
        }
      }
    }, 100)
    return () => {
      clearTimeout(timer)
    }
  }, [
    isPlaying,
    audioContextRef.current && analyserRef.current && audioRef.current,
  ])

  useEffect(() => {
    audioRef.current?.play()
  }, [mediaSource])

  const { log } = useLog()

  const onEnded = () => {
    // console.log('onEnded')
    log(getSongName(currentSong))
    if (currentMode === PLAYMODE.NORMAL) {
      playNext()
    } else {
      audioRef.current?.play()
    }
  }

  const init = () => {
    if (audioRef.current) {
      audioRef.current.onplay = () => {
        setIsPlaying(true)
      }
      audioRef.current.onpause = () => {
        setIsPlaying(false)
        cancelAnimationFrame(animationRef.current)
      }
      audioRef.current.volume = 0.1
      audioContextRef.current = new window.AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
    }
  }

  useEffect(() => {
    init()
    return () => {}
  }, [audioRef.current, setIsPlaying])

  socketOn('toggle', () =>
    audioRef.current?.paused
      ? audioRef.current.play()
      : audioRef.current?.pause()
  )

  socketOn('next', () => {
    playNext()
  })

  // console.log(isPlaying)
  return (
    <div
      className="player__container"
      onClick={(evt) => {
        if (['player__container', 'player'].includes(evt.target.className))
          if (isPlaying) {
            audioRef.current?.pause()
          } else {
            audioRef.current?.play()
          }
        // debugger
      }}
      onWheel={(evt) => {
        if (audioRef.current) {
          if (evt.deltaY > 0) {
            audioRef.current.volume = Math.max(
              0,
              audioRef.current.volume - 0.05
            )
          } else {
            audioRef.current.volume = Math.min(
              1,
              audioRef.current.volume + 0.05
            )
          }
        }
      }}
    >
      <div className="player">
        <video
          controls
          ref={audioRef}
          className="player"
          crossOrigin="anonymous"
          onEnded={onEnded}
          src={mediaSource}
        />
      </div>
      <div className="waveform top">
        {topBars.map((height, index) => (
          <div
            key={`${index}-${height}`}
            className="wave-bar"
            style={{
              height: `${height * 100}%`,
              backgroundColor: `hsl(${height * 120 + 200}, 100%, 50%)`,
            }}
          />
        ))}
      </div>
      <div className="waveform bottom">
        {bottomBars.map((height, index) => (
          <div
            key={`${index}-${height}`}
            className="wave-bar"
            style={{
              height: `${height * 100}%`,
              backgroundColor: `hsl(${height * 120 + 200}, 100%, 50%)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
