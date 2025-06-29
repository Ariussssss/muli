import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  useMemo,
  RefObject,
} from 'react'
import { useLocal } from './use-local'
import { useSocket } from './use-socket'
import { Socket } from 'socket.io-client'

export enum PLAYMODE {
  NORMAL,
  LOOP,
}

interface IPlaylistContext {
  musicMap: Map<string, string[]>
  currentTag: string
  setCurrentTag: (t: string) => void
  currentIndex: number
  setCurrentIndex: (t: number) => void
  currentMode: PLAYMODE
  setCurrentMode: (t: PLAYMODE) => void
  isPlaying: boolean
  setIsPlaying: (t: boolean) => void
  socketRef: RefObject<Socket | null>
}

export const PlaylistContext = createContext({
  musicMap: {},
  currentTag: '',
  setCurrentTag: () => null,
  currentIndex: 0,
  setCurrentIndex: () => null,
  currentMode: 0,
  setCurrentMode: () => null,
  isPlaying: false,
  setIsplaying: () => null,
  socketRef: null,
} as IPlaylistContext)

export const shuffleArray = (array: any[]) => {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

export const useInitPlaylist = () => {
  const [allDownloads, setAllDownloads] = useLocal(
    'muli_all_downloads',
    [] as string[]
  )
  const [lastDownload, setLastDownload] = useLocal('muli_last_download', {
    timestamp: 0,
  })
  const [last, setLast] = useLocal('muli_last', {
    device: '',
    currentTag: 'dat_phonk',
    currentMode: PLAYMODE.NORMAL,
    currentIndex: 0,
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTag, setCurrentTag] = useState(last.currentTag)
  const [currentIndex, setCurrentIndex] = useState(last.currentIndex)
  const [currentMode, setCurrentMode] = useState(last.currentMode)

  const { heartbeat, socketRef } = useSocket({ device: last.device })

  useEffect(() => {
    if (isPlaying) {
      heartbeat()
    }
  }, [isPlaying])

  const musicMap = useMemo(
    () =>
      allDownloads.reduce((a: IPlaylistContext['musicMap'], b: string) => {
        const tag = b.split('/')[1]
        a[tag] = a?.[tag] ?? []
        a[tag].push(b)
        return a
      }, {}),
    []
  )

  useEffect(() => {
    let { device } = last
    if (!device) {
      device = `device_${Math.random().toString(36).substr(2, 9)}`
    }
    setLast({ device, currentIndex, currentTag, currentMode })
  }, [currentTag, currentIndex, currentMode])

  useEffect(() => {
    const current = new Date().getTime()
    /* console.log(
     *   current,
     *   lastDownload.timestamp,
     *   current - lastDownload?.timestamp ?? 0
     * ) */
    if ((current - lastDownload?.timestamp ?? 0) > 1000 * 3600 * 24) {
      fetch('http://192.168.1.13:3210/api/all').then((e) => {
        e.json().then((res) => {
          if (res?.['downloads']) {
            setAllDownloads(shuffleArray(res['downloads']))
            setLastDownload({ timestamp: current })
          }
        })
      })
    }
  }, [])

  return {
    musicMap,
    currentIndex,
    setCurrentIndex,
    currentTag,
    setCurrentTag,
    currentMode,
    setCurrentMode,
    isPlaying,
    setIsPlaying,
    socketRef,
  } as IPlaylistContext
}

export const usePlaylist = () => {
  const ctx = useContext(PlaylistContext)
  const {
    musicMap,
    currentTag,
    currentIndex,
    setCurrentIndex,
    setCurrentTag,
    currentMode,
    setCurrentMode,
  } = ctx

  const currentList = useMemo(
    () =>
      (musicMap?.[currentTag] ?? Object.values(musicMap).flat()) as string[],
    [currentTag]
  )

  const currentSong = useMemo(
    () => currentList[currentIndex],
    [currentList, currentIndex]
  )
  /* console.log({ musicMap, currentTag, currentList, currentIndex, currentSong }) */

  const playNext = () => setCurrentIndex((e) => (e + 1) % currentList.length)

  return {
    ...ctx,
    currentList,
    currentSong,
    playNext,
  }
}
