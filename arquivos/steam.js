const axios = require('axios');
const cheerio = require('cheerio');

async function buscarJogoSteam(nome) {
  const searchUrl = `https://store.steampowered.com/search/?term=${encodeURIComponent(nome)}`
  const searchRes = await axios.get(searchUrl)
  const $ = cheerio.load(searchRes.data)

  const primeiraEntrada = $('.search_result_row').first()
  const titulo = primeiraEntrada.find('.title').text()
  const link = primeiraEntrada.attr('href')
  let imagem = primeiraEntrada.find('img').attr('src')
  const precoAtual = primeiraEntrada.find('.discount_final_price').text() || 'Não encontrado'
  const precoOriginal = primeiraEntrada.find('.discount_original_price').text() || precoAtual
  const desconto = primeiraEntrada.find('.discount_pct').text() || 'Nenhum'

  if (!titulo || !link) {
    throw new Error('Nenhum resultado encontrado na Steam.')
  }

  const jogoPage = await axios.get(link)
  const $$ = cheerio.load(jogoPage.data)

  const imagemGrande = $$('#gameHeaderImageCtn img').attr('src')
  if (imagemGrande && imagemGrande.startsWith('http')) {
    imagem = imagemGrande
  }

  const descricao = $$('#game_area_description').text().trim().replace(/\s+/g, ' ').slice(0, 400) + '...'
  const desenvolvedor = $$('#developers_list').text().trim() || 'Desconhecido'
  const publicador = $$('.dev_row').eq(1).find('.summary').text().trim() || 'Desconhecido'
  const dataLancamento = $$('.release_date .date').text().trim() || 'Desconhecida'

  return {
    status: true,
    titulo,
    link,
    imagem,
    precoAtual,
    precoOriginal,
    desconto,
    desenvolvedor,
    publicador,
    dataLancamento,
    descricao
  }
}

module.exports = {
  buscarJogoSteam
}
