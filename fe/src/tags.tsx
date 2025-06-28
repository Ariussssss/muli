import { Button, Menu, MenuProps } from 'antd'
import { usePlaylist } from './hooks/use-playlist'
import { useMemo, useState } from 'react'
import './style/tags.styl'

type MenuItem = Required<MenuProps>['items'][number]

interface TagsProps {}

export const Tags = ({}: TagsProps) => {
  const { musicMap, currentSong, currentTag, setCurrentTag, setCurrentIndex } =
    usePlaylist()
  const [currentFocus, setCurrentFocus] = useState(currentTag)

  const items = useMemo(() => {
    const res: MenuItem[] = []
    Object.entries(musicMap).map((a: [string, string[]]) => {
      const [tag, songs] = a
      // console.log(a)
      res.push({
        key: tag,
        label: tag,
        children: songs.map((key) => {
	  let label: any = key.split('/').pop()
	  label = label.split('.')
	  label.pop()
	  label = label.join('.')
          return {
            key,
            label,
          }
        }),
      })
    })
    return res
  }, [musicMap])

  return (
    <div className={`tags ${currentFocus ? 'is_focus' : ''}`}>
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
            </div>
          </div>
        )
      })}
    </div>
  )
}
