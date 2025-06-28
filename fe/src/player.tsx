import { useEffect, useRef, useState } from 'react'
import './style/player.styl'
import { usePlaylist } from './hooks/use-playlist'

interface PlayerProps {}

const BAR_COUNT = 90
export const Player = ({}: PlayerProps) => {
  const ctx = usePlaylist()
  const { currentSong, playNext } = ctx
  const mediaSource = 'http://192.168.1.13:3210/stream' + currentSong
  const [isPlaying, setIsPlaying] = useState(false)
  const [topBars, setTopBars] = useState(Array(BAR_COUNT / 2).fill(0.1))
  const [bottomBars, setBottomBars] = useState(Array(BAR_COUNT / 2).fill(0.1))

  const animationRef = useRef(0)
  const sourceRef = useRef<MediaElementAudioSourceNode>(null)
  const audioContextRef = useRef<AudioContext>(null)
  const audioRef = useRef<HTMLVideoElement>(null)
  const analyserRef = useRef<AnalyserNode>(null)
  const dataArrayRef = useRef<Uint8Array>(null)

  const init = () => {
    if (audioRef.current) {
      audioRef.current.onplay = () => setIsPlaying(true)
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
  }, [audioRef.current])

  const updateWaveform = () => {
    // console.log('analyserRef.current', analyserRef.current)
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current?.getByteFrequencyData?.(dataArrayRef.current)

      // Normalize and scale the data for visualization
      const newTopBars: number[] = []
      const newBottomBars: number[] = []
      const step = Math.floor((dataArrayRef.current?.length ?? 0) / BAR_COUNT)

      for (let i = 0; i < BAR_COUNT; i++) {
        let value = 0
        for (let j = 0; j < step; j++) {
          value += dataArrayRef.current?.[i + j] ?? 0
        }
        value = value / step / 255
        if (value > 0.3) {
          value = Math.min(1, value * 1.5)
        }
        if (i % 2 === 1) {
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

  const handlePlay = () => {
    // console.log({ sourceRef, audioContextRef, analyserRef, audioRef })
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

  useEffect(() => {
    audioRef.current?.play().then(handlePlay)
  }, [mediaSource])
  
  const onEnded = () => {
    // console.log('onEnded')
    playNext()
  }

  // console.log(isPlaying)
  return (
    <div
      className="player__container"
      onClick={(evt) => {
        if (['player__container', 'player'].includes(evt.target.className))
          if (isPlaying) {
            audioRef.current?.pause()
          } else {
            audioRef.current?.play().then(handlePlay)
          }
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
          // controls
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
