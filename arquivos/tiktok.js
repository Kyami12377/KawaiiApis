const axios = require('axios')

async function tiktokVideo(q) {
  if (!q.includes('http://') && !q.includes('https://'))
    throw new Error('❌ Link inválido! Use o link completo com "https://".')

  if (!q.includes('tiktok.com'))
    throw new Error('❌ Esse link não é do TikTok.')

  const res = await axios.post("https://www.tikwm.com/api/", {}, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'X-Requested-With': 'XMLHttpRequest'
    },
    params: {
      url: q,
      count: 12,
      cursor: 0,
      web: 1,
      hd: 1
    }
  })

  let data = res.data?.data
  if (!data || (!data.play && !data.hdplay)) {
    throw new Error("❌ Não foi possível baixar o vídeo.")
  }

  let videoUrl = data.hdplay
    ? 'https://www.tikwm.com' + data.hdplay
    : 'https://www.tikwm.com' + data.play

  return {
    status: true,
    titulo: data.title,
    usuario: `@${data.author?.unique_id}`,
    data: new Date(data.create_time * 1000).toLocaleDateString('pt-BR'),
    musica: `${data.music_info?.title} - ${data.music_info?.author}`,
    thumb: data.cover,
    video: videoUrl
  }
}

async function tiktokAudio(q) {
  if (!q.includes('http://') && !q.includes('https://'))
    throw new Error('❌ Link inválido! Use o link completo com "https://".')

  if (!q.includes('tiktok.com'))
    throw new Error('❌ Esse link não é do TikTok.')

  const res = await axios.post("https://www.tikwm.com/api/", {}, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'X-Requested-With': 'XMLHttpRequest'
    },
    params: {
      url: q,
      count: 12,
      cursor: 0,
      web: 1,
      hd: 1
    }
  })

  let music = res.data?.data?.music_info
  let musicUrl = 'https://www.tikwm.com' + (res.data?.data?.music || music?.play)

  if (!music || !musicUrl) throw new Error("❌ Não foi possível extrair o áudio.")

  return {
    status: true,
    musica: music.title,
    autor: music.author,
    audio: musicUrl,
    thumb: res.data?.data?.cover
  }
}

module.exports = {
  tiktokVideo,
  tiktokAudio
}
