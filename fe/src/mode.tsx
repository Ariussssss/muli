import { SyncOutlined } from '@ant-design/icons'
import { PLAYMODE, usePlaylist } from './hooks/use-playlist'
import './style/mode.styl'

interface ModeProps {}
export const Mode = ({}: ModeProps) => {
  const { currentMode, setCurrentMode, socketOn } = usePlaylist()
  const isLoop = currentMode === PLAYMODE.LOOP

  const toggle = () =>
    setCurrentMode((e: PLAYMODE) =>
      e === PLAYMODE.LOOP ? PLAYMODE.NORMAL : PLAYMODE.LOOP
    )

  socketOn('loop', toggle)
  
  return (
    <div
      className={`mode-controller ${isLoop ? 'is_active' : ''}`}
      onClick={toggle}
    >
      <SyncOutlined spin={isLoop} />
    </div>
  )
}
