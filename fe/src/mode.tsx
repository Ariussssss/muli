import { SyncOutlined } from '@ant-design/icons'
import { PLAYMODE, usePlaylist } from './hooks/use-playlist'
import './style/mode.styl'

interface ModeProps {}
export const Mode = ({}: ModeProps) => {
  const { currentMode, setCurrentMode } = usePlaylist()
  const isLoop = currentMode === PLAYMODE.LOOP
  return (
    <div
      className={`mode-controller ${isLoop ? 'is_active' : ''}`}
      onClick={() =>
        setCurrentMode((e: PLAYMODE) =>
          e === PLAYMODE.LOOP ? PLAYMODE.NORMAL : PLAYMODE.LOOP
        )
      }
    >
      <SyncOutlined spin={isLoop} />
    </div>
  )
}
