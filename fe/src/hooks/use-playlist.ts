import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  useMemo,
} from 'react'
import { useLocal } from './use-local'

interface IPlaylistContext {
  musicMap: Map<string, string[]>
  currentTag: string
  setCurrentTag: (t: string) => void
  currentIndex: number
  setCurrentIndex: (t: string) => void
}
export const PlaylistContext = createContext({
  musicMap: {},
  currentTag: '',
  setCurrentTag: () => null,
  currentIndex: '',
  setCurrentIndex: () => null,
} as IPlaylistContext)

const shuffleArray = (array: any[]) => {
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
  const [currentTag, setCurrentTag] = useState('dat_phonk')
  const [currentIndex, setCurrentIndex] = useState(0)

  const musicMap = useMemo(
    () =>
      shuffleArray(allDownloads).reduce(
        (a: IPlaylistContext['musicMap'], b: string) => {
          const tag = b.split('/')[1]
          a[tag] = a?.[tag] ?? []
          a[tag].push(b)
          return a
        },
        {}
      ),
    []
  )

  useEffect(() => {
    fetch('http://192.168.1.13:3210/api/all').then((e) => {
      e.json().then((res) => {
        setAllDownloads(res['downloads'])
      })
    })
  })

  return {
    musicMap,
    currentIndex,
    setCurrentIndex,
    currentTag,
    setCurrentTag,
  } as IPlaylistContext
}

export const usePlaylist = () => {
  const { musicMap, currentTag, currentIndex, setCurrentIndex, setCurrentTag } =
    useContext(PlaylistContext)

  const currentList = useMemo(() => {
    if (musicMap[currentTag]) {
      return musicMap[currentTag]
    } else {
      return Object.values(musicMap).flat()
    }
  }, [currentTag])

  const currentSong = useMemo(
    () => currentList[currentIndex],
    [currentList, currentIndex]
  )
  /* console.log({ musicMap, currentTag, currentList, currentIndex, currentSong }) */

  const playNext = () => setCurrentIndex((e) => (e + 1) % currentList.length)

  return {
    musicMap,
    currentIndex,
    setCurrentIndex,
    currentTag,
    setCurrentTag,
    currentSong,
    playNext
  }
}
