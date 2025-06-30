import { Button, Menu, MenuProps } from 'antd'
import { usePlaylist } from './hooks/use-playlist'
import { useEffect, useMemo, useRef, useState } from 'react'
import './style/tags.styl'
import { getSongName, getTag } from './utils'

type MenuItem = Required<MenuProps>['items'][number]

interface TagsProps {}

export const Tags = ({}: TagsProps) => {
  const {
    musicMap,
    currentSong,
    currentTag,
    setCurrentTag,
    setCurrentIndex,
    socketOn,
  } = usePlaylist()
  const [currentFocus, setCurrentFocus] = useState(currentTag)
  const tagsElRef = useRef<HTMLDivElement>(null)

  socketOn('playlist', ({ name }) => {
    setCurrentFocus(name)
    setCurrentTag(name)
    setCurrentIndex(0)
  })

  socketOn(
    'song',
    ({ name }) => {
      const tag = getTag(name)
      setCurrentFocus(tag)
      setCurrentTag(tag)
      setCurrentIndex(musicMap?.[tag]?.indexOf(name))
    },
    [musicMap]
  )

  const items = useMemo(() => {
    const res: MenuItem[] = []
    Object.entries(musicMap).map((a: [string, string[]]) => {
      const [tag, songs] = a
      // console.log(a)
      res.push({
        key: tag,
        label: tag,
        children: songs.map((key) => ({
          key,
          label: getSongName(key),
        })),
      })
    })
    return res
  }, [musicMap])

  useEffect(() => {
    let timer = setTimeout(() => {
      if (
        items
          ?.find((e) => e?.key === currentFocus)
          ?.children?.some((e) => e.key === currentSong)
      ) {
        const el = tagsElRef.current?.querySelector('.tag__song.is_current')
        if (el) {
          const container = el.parentNode
          const scrollTo =
            el?.offsetTop - container?.clientHeight / 2 - el?.clientHeight / 2

          container?.scrollTo({
            top: scrollTo,
            behavior: 'smooth',
          })
        }
      }
    }, 300)
    return () => {
      clearTimeout(timer)
    }
  }, [currentSong, currentFocus])

  return (
    <div className={`tags ${currentFocus ? 'is_focus' : ''}`} ref={tagsElRef}>
      {items.map((e) => {
        let tagClass = ''
        if (currentFocus) {
          if (currentFocus === e?.key) {
            tagClass = 'is_focus'
          } else {
            tagClass = 'is_closed'
          }
        } else if (currentTag === e?.key) {
          tagClass = 'is_focus'
        }
        return (
          <div className="tag__container" key={e?.key}>
            <div
              key={e?.key}
              className={`tag ${tagClass}`}
              onClick={() =>
                setCurrentFocus((c) => (c === e?.key ? '' : e.key))
              }
            >
              {e?.label}
            </div>
            <div
              className={`tag__songs ${currentFocus === e?.key ? 'is_focus' : 'is_closed'}`}
            >
              {currentFocus === e?.key
                ? e.children.map((ee, i) => (
                    <div
                      key={ee?.key}
                      className={`tag__song ${currentSong === ee?.key ? 'is_current' : ''}`}
                      onClick={() => {
                        setCurrentTag(e?.key)
                        setCurrentIndex(i)
                      }}
                    >
                      {ee.label}
                    </div>
                  ))
                : null}
              <div style={{ height: '40vh', width: '100%' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
