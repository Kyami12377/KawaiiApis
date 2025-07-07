const express = require('express')
const path = require('path')
const axios = require('axios')
const cheerio = require('cheerio')
const app = express()
const PORT = 3000

// Scrapers
const { ytPlayMp3, ytPlayMp4 } = require('./arquivos/youtube.js')

const { tiktokVideo, tiktokAudio } = require('./arquivos/tiktok.js')

const { buscarJogoSteam } = require('./arquivos/steam')

// Middleware para servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')))

// Página inicial
app.get('/', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
)

// Página de login
app.get('/login', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'login.html'))
)

// GitHub Stalk
app.get('/github/:user', async (req, res) => {
  const { user } = req.params
  try {
    const { data } = await axios.get(`https://api.github.com/users/${user}`)
    res.json({
      nome: data.name || data.login,
      usuario: data.login,
      bio: data.bio,
      seguidores: data.followers,
      seguindo: data.following,
      repos: data.public_repos,
      avatar: data.avatar_url,
      perfil: data.html_url,
      criado_em: data.created_at
    })
  } catch {
    res.status(404).json({ erro: 'Usuário do GitHub não encontrado!' })
  }
})

// 🎵 Play Música
app.get('/play', async (req, res) => {
  const query = req.query.q
  if (!query) return res.status(400).json({ erro: 'Faltou o parâmetro ?q=' })

  try {
    const resultado = await ytPlayMp3(query)
    res.json(resultado)
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao buscar música', detalhe: e.message })
  }
})

// 📹 Play Vídeo
app.get('/playvid', async (req, res) => {
  const query = req.query.q
  if (!query) return res.status(400).json({ erro: 'Faltou o parâmetro ?q=' })

  try {
    const resultado = await ytPlayMp4(query)
    res.json(resultado)
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao buscar vídeo', detalhe: e.message })
  }
})

// 🎬 Rota TikTok Vídeo
app.get('/tiktokmp4', async (req, res) => {
    const q = req.query.q
    if (!q) return res.status(400).json({
      erro: '💛 Onii-chan... você esqueceu de me mandar o link do TikTok! 🌸',
      exemplo: '/tiktokmp4?q=https://www.tiktok.com/@usuario/video/123456'
    })
  
    try {
      const result = await tiktokVideo(q)
      res.json(result)
    } catch (e) {
      res.status(500).json({ erro: e.message })
    }
  })
  
  // 🎧 Rota TikTok Áudio
  app.get('/tiktokmp3', async (req, res) => {
    const q = req.query.q
    if (!q) return res.status(400).json({
      erro: '💛 Onii-chan... você esqueceu de me mandar o link do TikTok! 🌸',
      exemplo: '/tiktokmp3?q=https://www.tiktok.com/@usuario/video/123456'
    })
  
    try {
      const result = await tiktokAudio(q)
      res.json(result)
    } catch (e) {
      res.status(500).json({ erro: e.message })
    }
  })

// 🎮 Rota Steam Jogo
app.get('/steamjogo', async (req, res) => {
    const query = req.query.q
    if (!query) {
      return res.status(400).json({
        erro: 'Informe o nome do jogo usando o parâmetro ?q=nome_do_jogo',
        exemplo: '/steamjogo?q=Counter Strike'
      })
    }
  
    try {
      const resultado = await buscarJogoSteam(query)
      res.json(resultado)
    } catch (err) {
      console.error(err)
      res.status(500).json({ erro: err.message || 'Erro ao buscar informações na Steam.' })
    }
  })

// 📦 Rota /amazon?q=produto
app.get('/amazon', async (req, res) => {
    const query = req.query.q
    if (!query) return res.status(400).json({ erro: 'Faltou o parâmetro ?q=' })
  
    const cheerio = require('cheerio')
    const axios = require('axios')
  
    try {
      const url = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}`
      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36'
        }
      })
  
      const $ = cheerio.load(html)
      const result = $('div.s-main-slot div[data-component-type="s-search-result"]').first()
  
      if (!result.length) {
        return res.status(404).json({ erro: 'Nenhum produto encontrado.' })
      }
  
      const title = result.find('h2 a span').text() || 'Produto sem título'
      const linkPart = result.find('h2 a').attr('href') || ''
      const link = `https://www.amazon.com.br${linkPart}`
  
      const priceWhole = result.find('.a-price-whole').first().text().replace(/\./g, '')
      const priceFraction = result.find('.a-price-fraction').first().text()
      const price = priceWhole ? `R$ ${priceWhole},${priceFraction}` : 'Preço não encontrado'
  
      const rating = result.find('.a-icon-alt').first().text() || 'Sem avaliação'
      const image = result.find('img.s-image').attr('src') || null
  
      return res.json({
        produto: title,
        preco: price,
        avaliacao: rating,
        imagem: image,
        link: link
      })
    } catch (err) {
      console.error('[AMAZON API]', err.message)
      return res.status(500).json({ erro: 'Erro ao buscar produto na Amazon.' })
    }
  })
  
// 🎨 Rota /gerarnick?q=texto
app.get(['/gerarnick', '/fazernick'], (req, res) => {
    const q = req.query.q
    if (!q) return res.status(400).json({ erro: 'Faltou o parâmetro ?q=' })
  
    const txt = q.toLowerCase()
  
    const mapToUnicode = (text, map) => text.split('').map(c => map[c] || c).join('')
  
    const hebrewMap = { g: 'ג', o: 'ו', j: 'נ' }
    const arabicMap = { g: 'ﻭ', o: 'ѻ', j: 'ﻝ' }
    const phoneticMap = { g: 'ɢ', o: 'օ', j: 'ʝ' }
    const runicMap = { g: 'ᚷ', o: 'ᛟ', j: 'ᛃ' }
    const katakanaMap = { g: 'Ꮆ', o: 'ㄖ', j: 'ﾌ' }
    const circleCapsMap = { g: '⒢', o: '⒪', j: '⒥' }
    const squaredCapsMap = { g: '🄶', o: '🄾', j: '🄹' }
    const bubbleCapsMap = { g: '🅖', o: '🅞', j: '🅙' }
    const emojiBubbleCapsMap = { G: '🇬', O: '🇴', J: '🇯' }
  
    const reversedMap = {
      a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ',
      i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'ʃ', m: 'ɯ', n: 'u', o: 'o', p: 'd',
      q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x',
      y: 'ʎ', z: 'z'
    }
  
    const fontes = [
      { nome: 'Negrito', fn: t => t.replace(/[a-z]/g, c => String.fromCodePoint(0x1D41A + c.charCodeAt(0) - 97)) },
      { nome: 'Itálico', fn: t => t.replace(/[a-z]/g, c => String.fromCodePoint(0x1D44E + c.charCodeAt(0) - 97)) },
      { nome: 'Negrito Itálico', fn: t => t.replace(/[a-z]/g, c => String.fromCodePoint(0x1D482 + c.charCodeAt(0) - 97)) },
      { nome: 'Script Normal', fn: t => t.replace(/[a-z]/g, c => String.fromCodePoint(0x1D4B6 + c.charCodeAt(0) - 97)) },
      { nome: 'Script Negrito', fn: t => t.replace(/[a-z]/g, c => String.fromCodePoint(0x1D4D0 + c.charCodeAt(0) - 97)) },
      { nome: 'Duplo Riscado', fn: t => t.replace(/[a-z]/g, c => String.fromCodePoint(0x1D552 + c.charCodeAt(0) - 97)) },
      { nome: 'Gótico', fn: t => t.replace(/[a-z]/g, c => String.fromCodePoint(0x1D51E + c.charCodeAt(0) - 97)) },
      { nome: 'Gótico Negrito', fn: t => t.replace(/[a-z]/g, c => String.fromCodePoint(0x1D56C + c.charCodeAt(0) - 97)) },
      { nome: 'Monoespaçado', fn: t => t.toUpperCase().replace(/[A-Z]/g, c => String.fromCodePoint(0x1D670 + c.charCodeAt(0) - 65)) },
      { nome: 'Bolha', fn: t => t.replace(/[a-z]/g, c => String.fromCodePoint(0x24D0 + c.charCodeAt(0) - 97)) },
      { nome: 'Bolha Maiúscula', fn: t => t.toUpperCase().replace(/[A-Z]/g, c => String.fromCodePoint(0x24B6 + c.charCodeAt(0) - 65)) },
      { nome: 'Bolha Negrito', fn: t => mapToUnicode(t.toUpperCase(), bubbleCapsMap) },
      { nome: 'Quadrado Maiúsculo', fn: t => mapToUnicode(t.toUpperCase(), squaredCapsMap) },
      { nome: 'Quadrado Alternativo', fn: t => mapToUnicode(t.toUpperCase(), circleCapsMap) },
      { nome: 'Fullwidth', fn: t => t.replace(/[a-z]/g, c => String.fromCodePoint(0xFF41 + c.charCodeAt(0) - 97)) },
      { nome: 'Invertido', fn: t => t.split('').reverse().map(c => reversedMap[c] || c).join('') },
      { nome: 'Hebraico', fn: t => mapToUnicode(t, hebrewMap) },
      { nome: 'Árabe', fn: t => mapToUnicode(t, arabicMap) },
      { nome: 'Fonético', fn: t => mapToUnicode(t, phoneticMap) },
      { nome: 'Rúnico', fn: t => mapToUnicode(t, runicMap) },
      { nome: 'Katakana', fn: t => mapToUnicode(t, katakanaMap) },
      { nome: 'Emoji Bandeira', fn: t => t.toUpperCase().split('').map(c => emojiBubbleCapsMap[c] || c).join('') },
      { nome: 'Sobrescrito', fn: t => t.split('').map(c => ({a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',q:'ᑫ',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',y:'ʸ',z:'ᶻ'}[c]||c)).join('') },
      { nome: 'Riscado', fn: t => t.split('').map(c => c + '\u0336').join('') },
      { nome: 'Sublinhado', fn: t => t.split('').map(c => c + '\u0332').join('') },
      { nome: 'Tachado + Sublinhado', fn: t => t.split('').map(c => c + '\u0336\u0332').join('') },
      { nome: 'Normal', fn: t => t }
    ]
  
    const estilizados = fontes.map(f => ({
      estilo: f.nome,
      nick: f.fn(txt)
    }))
  
    res.json({ entrada: txt, resultados: estilizados })
  })
  
  // 📰 Rota /g1 ou /g1news
app.get(['/g1', '/g1news'], async (req, res) => {
    const axios = require('axios');
    const cheerio = require('cheerio');
  
    try {
      const { data: html } = await axios.get('https://g1.globo.com/');
      const $ = cheerio.load(html);
      const noticias = $('.feed-post');
  
      if (noticias.length < 2) {
        return res.status(404).json({ erro: 'Nenhuma notícia encontrada no G1.' });
      }
  
      const noticia = noticias.eq(1);
      const titulo = noticia.find('.feed-post-link').text().trim() || 'Sem título';
      const url = noticia.find('.feed-post-link').attr('href') || 'Sem link';
      const categoria = noticia.find('.feed-post-metadata-section').text().trim() || 'Sem categoria';
      const postado = noticia.find('.feed-post-datetime').text().trim() || 'Data desconhecida';
      let imagem = noticia.find('img').attr('src');
  
      if (imagem && imagem.startsWith('//')) {
        imagem = 'https:' + imagem;
      }
  
      res.json({
        titulo,
        url,
        categoria,
        postado,
        imagem: imagem || null
      });
  
    } catch (err) {
      console.error('Erro ao buscar notícia do G1:', err.message);
      res.status(500).json({ erro: 'Erro ao buscar notícia do G1.' });
    }
  });  

// 💬 POST /ia-voz?q=mensagem|voz
app.get('/ia-voz', async (req, res) => {
  const q = req.query.q
  if (!q) {
    return res.status(400).json({ erro: 'Faltou o parâmetro ?q=mensagem|voz' })
  }

  const models = {
    miku: { voice_id: "67aee909-5d4b-11ee-a861-00163e2ac61b", voice_name: "Hatsune Miku" },
    nahida: { voice_id: "67ae0979-5d4b-11ee-a861-00163e2ac61b", voice_name: "Nahida" },
    nami: { voice_id: "67ad95a0-5d4b-11ee-a861-00163e2ac61b", voice_name: "Nami" },
    ana: { voice_id: "f2ec72cc-110c-11ef-811c-00163e0255ec", voice_name: "Ana" },
    optimus_prime: { voice_id: "67ae0f40-5d4b-11ee-a861-00163e2ac61b", voice_name: "Optimus Prime" },
    goku: { voice_id: "67aed50c-5d4b-11ee-a861-00163e2ac61b", voice_name: "Goku" },
    taylor_swift: { voice_id: "67ae4751-5d4b-11ee-a861-00163e2ac61b", voice_name: "Taylor Swift" },
    elon_musk: { voice_id: "67ada61f-5d4b-11ee-a861-00163e2ac61b", voice_name: "Elon Musk" },
    mickey_mouse: { voice_id: "67ae7d37-5d4b-11ee-a861-00163e2ac61b", voice_name: "Mickey Mouse" },
    kendrick_lamar: { voice_id: "67add638-5d4b-11ee-a861-00163e2ac61b", voice_name: "Kendrick Lamar" },
    angela_adkinsh: { voice_id: "d23f2adb-5d1b-11ee-a861-00163e2ac61b", voice_name: "Angela Adkinsh" },
    eminem: { voice_id: "c82964b9-d093-11ee-bfb7-e86f38d7ec1a", voice_name: "Eminem" }
  }

  const [msg, voiceKey] = q.split('|').map(v => v?.trim()?.toLowerCase())

  if (!msg || !voiceKey || !(voiceKey in models)) {
    const lista = Object.entries(models).map(([k, v]) => `• ${k} = ${v.voice_name}`).join('\n')
    return res.status(400).json({
      erro: 'Formato inválido. Use: ?q=mensagem|voz',
      exemplo: '/ia-voz?q=olá mundo|miku',
      vozes_disponiveis: lista
    })
  }

  const getRandomIp = () => Array.from({ length: 4 }).map(() => Math.floor(Math.random() * 256)).join('.')

  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
    "Mozilla/5.0 (Linux; Android 8.0.0)"
  ]

  const selected = models[voiceKey]

  const payload = {
    raw_text: msg,
    url: "https://filme.imyfone.com/text-to-speech/anime-text-to-speech/",
    product_id: "200054",
    convert_data: [
      {
        voice_id: selected.voice_id,
        speed: "1",
        volume: "50",
        text: msg,
        pos: 0
      }
    ]
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'X-Forwarded-For': getRandomIp(),
      'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)]
    }
  }

  try {
    const response = await axios.post('https://voxbox-tts-api.imyfone.com/pc/v1/voice/tts', payload, config)
    const audioUrl = response.data.data.convert_result[0].oss_url

    res.json({
      voz: selected.voice_name,
      modelo: voiceKey,
      mensagem: msg,
      audio_url: audioUrl
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      erro: 'Erro ao gerar TTS',
      detalhe: err.message
    })
  }
})

app.get('/pinterest', async (req, res) => {
    const q = req.query.q
    if (!q) return res.status(400).json({ erro: 'Você deve passar o parâmetro ?q=' })
  
    try {
      const https = require('https')
      const axios = require('axios')
      const qs = require('qs')
  
      const agent = new https.Agent({ keepAlive: true })
  
      const home = await axios.get('https://www.pinterest.com/', {
        httpsAgent: agent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'text/html,application/xhtml+xml'
        }
      })
  
      const raw = home.headers['set-cookie'] || []
      const cookies = raw.map(c => c.split(';')[0]).join('; ')
      const csrf = (raw.find(c => c.startsWith('csrftoken=')) || '').split('=')[1]?.split(';')[0] || ''
  
      const source_url = `/search/pins/?q=${encodeURIComponent(q)}`
      const data = {
        options: { query: q, field_set_key: 'react_grid_pin', is_prefetch: false, page_size: 10 },
        context: {}
      }
  
      const body = qs.stringify({ source_url, data: JSON.stringify(data) })
  
      const resPinterest = await axios.post(
        'https://www.pinterest.com/resource/BaseSearchResource/get/',
        body,
        {
          httpsAgent: agent,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-CSRFToken': csrf,
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://www.pinterest.com',
            'Referer': `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`,
            'Cookie': cookies
          }
        }
      )
  
      const results = resPinterest.data.resource_response.data.results
      if (!results || !results.length) {
        return res.status(404).json({ erro: 'Nenhuma imagem encontrada no Pinterest.' })
      }
  
      const pick = results[Math.floor(Math.random() * results.length)]
      const img = pick.images?.orig?.url || pick.images?.['236x']?.url
      const link = `https://www.pinterest.com/pin/${pick.id}/`
  
      return res.json({
        termo: q,
        imagem: img,
        link
      })
  
    } catch (err) {
      console.error(err)
      return res.status(500).json({ erro: 'Erro ao buscar no Pinterest.', detalhe: err.message })
    }
  })  

// 💡 Exemplo de rota genérica pronta para copiar
// app.get('/novarota', async (req, res) => {
//   const query = req.query.q
//   if (!query) return res.status(400).json({ erro: 'Faltou o parâmetro ?q=' })
//   try {
//     const resultado = await algumScraper(query)
//     res.json(resultado)
//   } catch (e) {
//     res.status(500).json({ erro: 'Erro', detalhe: e.message })
//   }
// })

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`🌸 Servidor Kawaii rodando: http://localhost:${PORT}`)
})
