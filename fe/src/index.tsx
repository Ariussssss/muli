import { createRoot } from 'react-dom/client'
import 'normalize.css/normalize.css'
import './style/global.styl'
import { Player } from './player'
import { PlaylistContext, useInitPlaylist } from './hooks/use-playlist'
import { Tags } from './tags'
import { Mode } from './mode'
// 
// const Counter = () => {
//   const [count, setCount] = useState(1)
//   useEffect(() => {
//     const t = setInterval(() => {
//       setCount((e) => e + 1)
//     }, 500)
//     return () => {
//       clearInterval(t)
//     }
//   }, [])
//   return <Typography.Title level={3}>counter: {count}</Typography.Title>
// }
// const Label = () => <Typography.Title>Hello, world! {NODE_ENV}</Typography.Title>
// 
const App = () => {
  const playlistContextValue = useInitPlaylist()
  return (
    <div className="muli">
      <PlaylistContext value={playlistContextValue}>
	<Tags/>
	<Mode />
	<Player />
      </PlaylistContext>
    </div>
  )
}

const container = document.getElementById('app')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
}
