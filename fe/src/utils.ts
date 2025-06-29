export const getSongName= (song: string) => {
  let songName = song.split('/').pop()
  songName = songName.split('.')
  songName		     .pop()
  songName= songName.join('.')
  return songName as string
}
