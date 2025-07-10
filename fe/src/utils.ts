export const getSongName = (song: string) => {
  let songName = song.split('/').pop()
  songName = songName.split('.')
  songName.pop()
  songName = songName.join('.')
  return songName as string
}

export const getTag = (url: string) => {
  return url.replace('/mnt/arch-8T/Music/Spotify', '').split('/')[1] as string
}

export const isIOS = () => (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )

