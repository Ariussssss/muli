import { useEffect, useRef, useState } from 'react'
import './style/player.styl'
import { PLAYMODE, usePlaylist } from './hooks/use-playlist'
import { SERVER_HOST } from './const'
import { useLog } from './hooks/use-log'
import { getSongName, isIOS } from './utils'
import { Progress, notification } from 'antd'

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
    playPrevious,
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
  const playerBgRef = useRef<HTMLCanvasElement>(null)

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

  const drawBg = () => {
    if (playerBgRef.current && audioRef.current) {
      const ctx = playerBgRef.current.getContext('2d')
      playerBgRef.current.width = window.innerWidth
      playerBgRef.current.height = window.innerHeight
      const rect = audioRef.current.getBoundingClientRect()
      if (window.innerHeight > window.innerWidth) {
        const w = (window.innerHeight / rect.height) * rect.width
        ctx?.drawImage(
          audioRef.current,
          window.innerWidth / 2 - w / 2,
          0,
          w,
          window.innerHeight
        )
      } else {
        const h = (window.innerWidth / rect.width) * rect.height
        ctx?.drawImage(
          audioRef.current,
          0,
          window.innerHeight / 2 - h / 2,
          window.innerWidth,
          h
        )
      }
    }
  }

  useEffect(() => {
    if (audioRef.current?.readyIOS || !isIOS()){
      audioRef.current?.play()
    }
    let timer = 0
    let f = () => {
      timer = setTimeout(drawBg, 300)
    }
    f()
    window.addEventListener('resize', f)
    return () => {
      window.removeEventListener('resize', f)
      clearTimeout(timer)
    }
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
	audioRef.current.readyIOS = true
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
    let f = (evt: KeyboardEvent) => {
      if (audioRef.current) {
        if (evt.key === 'n') {
          playNext()
        } else if (evt.key === 'p') {
          playPrevious()
        } else if (evt.key === ' ') {
          audioRef.current.paused
            ? audioRef.current.play()
            : audioRef.current.pause()
        } else if (evt.key === 'ArrowRight') {
          audioRef.current.currentTime = Math.min(
            audioRef.current.currentTime + 5,
            audioRef.current.duration
          )
        } else if (evt.key === 'ArrowLeft') {
          audioRef.current.currentTime = Math.max(
            audioRef.current.currentTime - 5,
            0
          )
        }
      }
    }
    document.body.addEventListener('keyup', f)

    let startY = 0
    let startVolume = 0

    let ts = (e) => {
      if (e.touches.length === 1) {
	audioRef.current.muted = false
        startY = e.touches[0].clientY
        startVolume = audioRef.current.volume
      }
    }
    let tm = (e) => {
      if (e.touches.length === 1) {
        const currentY = e.touches[0].clientY
        const deltaY = startY - currentY

        // 滑动方向向上增加音量，向下减少音量
        const deltaVolume = deltaY / 200 // 可调整灵敏度
        let newVolume = startVolume + deltaVolume

        // 限制音量在 0~1 之间
        newVolume = Math.max(0, Math.min(1, newVolume))
        audioRef.current.volume = newVolume

        // 可选：防止滚动页面
        e.preventDefault()
        console.log(audioRef.current?.muted, audioRef.current?.volume)
        console.log(audioRef.current)
      }
    }
    document.addEventListener('touchstart', ts)
    document.addEventListener('touchmove', tm)
    return () => {
      document.body.removeEventListener('keyup', f)
      document.removeEventListener('touchstart', ts)
      document.removeEventListener('touchmove', tm)
    }
  }, [audioRef.current, setIsPlaying])

  socketOn('toggle', () =>
    audioRef.current?.paused
      ? audioRef.current.play()
      : audioRef.current?.pause()
  )

  socketOn('next', () => {
    playNext()
  })

  socketOn('previous', () => {
    playPrevious()
  })

  // console.log(isPlaying)
  return (
    <div
      className="player__container"
      onClick={(evt) => {
        if (['player__container', 'player'].includes(evt.target.className))
          if (audioRef.current?.paused) {
            audioRef.current?.play()
          } else {
            audioRef.current?.pause()
          }
        // debugger
      }}
      onWheel={(evt) => {
        if (audioRef.current) {
          let volume = audioRef.current.volume
          if (evt.deltaY > 0) {
            volume = Math.max(0, volume - 0.05)
          } else {
            volume = Math.min(1, volume + 0.05)
          }
        }
      }}
    >
      <div className="player__bg">
        <canvas ref={playerBgRef} />
        <div className="player__bg--glass" />
      </div>

      <div className="player">
        <div className="video">
          <video
            playsinline
            webkit-playsinline
            ref={audioRef}
            crossOrigin="anonymous"
            onEnded={onEnded}
            src={mediaSource}
          />
          <Progress
            key={mediaSource}
            className="progress"
            strokeColor={{
              '0%': '#4b6cb7',
              '100%': '#f612ff',
            }}
            size={{
              height: 20,
            }}
            showInfo={false}
            onClick={(evt) => {
              const rect =
                audioRef.current?.parentElement.getBoundingClientRect()
              const offsetX = evt.clientX - rect.left
              const percent = offsetX / rect.width
              // debugger
              if (audioRef.current) {
                audioRef.current.currentTime =
                  audioRef.current.duration * percent
              }
            }}
            percent={Math.floor(
              (audioRef.current
                ? audioRef.current.currentTime / audioRef.current.duration
                : 0) * 100
            )}
            status="active"
          />
        </div>
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
