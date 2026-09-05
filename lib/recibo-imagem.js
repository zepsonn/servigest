/**
 * Desenha o recibo como IMAGEM (PNG) usando Canvas puro — sem biblioteca.
 *
 * Por que canvas e nao "print to PDF":
 *  - sai no tamanho exato do conteudo (cresce sozinho conforme o texto)
 *  - vira arquivo que da pra mandar no WhatsApp junto com o texto
 *  - fica identico em qualquer celular (nao depende do menu de impressao)
 */

const VERDE = '#1D9E75'
const VERDE_ESC = '#137a58'
const TINTA = '#16150f'
const CINZA = '#9c988c'
const LINHA = '#f1efe9'

const L = 760          // largura do recibo (px)
const PAD = 46         // margem interna
const ESCALA = 2       // desenha em 2x pra ficar nitido

function fonte(peso, tam, familia) {
  return peso + ' ' + tam + 'px ' + (familia || "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif")
}

/** Quebra o texto em linhas que cabem na largura. */
function quebrar(ctx, texto, largura) {
  const palavras = String(texto || '').split(/\s+/).filter(Boolean)
  if (!palavras.length) return []
  const linhas = []
  let atual = palavras[0]
  for (let i = 1; i < palavras.length; i++) {
    const teste = atual + ' ' + palavras[i]
    if (ctx.measureText(teste).width > largura) { linhas.push(atual); atual = palavras[i] }
    else atual = teste
  }
  linhas.push(atual)
  return linhas
}

function arredondado(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * dados = {
 *   status, valor, empresa:{nome,cnpj,endereco,telefone,email},
 *   numero, campos:[{rotulo, valor}], servicos:[...],
 *   rodape:[{rotulo, valor}], alterada
 * }
 */
/** Carrega a logo (base64) pra poder desenhar no canvas. */
function carregarLogo(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)   // sem logo o recibo sai igual, so sem a marca
    img.src = src
  })
}

export async function gerarReciboPNG(dados, familiaFonte) {
  // espera a fonte carregar, senao o canvas desenha com a fonte de fallback
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try { await document.fonts.ready } catch (e) {}
  }
  const logo = await carregarLogo(dados.logo)

  const medidor = document.createElement('canvas').getContext('2d')
  const larguraTexto = L - PAD * 2

  // ---------- 1a passada: calcula a altura necessaria ----------
  let alturaCorpo = 0
  const blocos = []

  ;(dados.campos || []).forEach(c => {
    if (!String(c.valor || '').trim()) return
    medidor.font = fonte(500, 25, familiaFonte)
    const linhas = quebrar(medidor, c.valor, larguraTexto)
    const alt = 20 + 17 + linhas.length * 34 + 20      // rotulo + gap + linhas + respiro
    blocos.push({ tipo: 'campo', rotulo: c.rotulo, linhas, alt, forte: c.forte })
    alturaCorpo += alt
  })

  // listas (aparelhos e servicos) — viram bullets quando tem mais de um
  ;[...(dados.listas || [])].forEach(L2 => {
    if (!(L2.itens || []).length) return
    medidor.font = fonte(L2.forte ? 700 : 500, 25, familiaFonte)
    const linhas = L2.itens.map(s => quebrar(medidor, (L2.itens.length > 1 ? '•  ' : '') + s, larguraTexto))
    const nLinhas = linhas.reduce((s, i) => s + i.length, 0)
    const alt = 20 + 17 + nLinhas * 34 + 20
    blocos.push({ tipo: 'lista', rotulo: L2.itens.length > 1 ? L2.varios : L2.um, itens: linhas, alt, forte: L2.forte })
    alturaCorpo += alt
  })

  // campos que vem depois das listas (relato, diagnostico)
  ;(dados.camposFim || []).forEach(c => {
    if (!String(c.valor || '').trim()) return
    medidor.font = fonte(500, 25, familiaFonte)
    const linhas = quebrar(medidor, c.valor, larguraTexto)
    const alt = 20 + 17 + linhas.length * 34 + 20
    blocos.push({ tipo: 'campo', rotulo: c.rotulo, linhas, alt })
    alturaCorpo += alt
  })

  // cabecalho
  medidor.font = fonte(600, 21, familiaFonte)
  const subLinhas = quebrar(medidor, dados.subtitulo || '', larguraTexto)
  const alturaTopo = 62 + 96 + 26 + 74 + 34 + subLinhas.length * 28 + (dados.alterada ? 46 : 0) + 46

  // rodape
  const rod = (dados.rodape || []).filter(r => String(r.valor || '').trim())
  const alturaRodapeTopo = rod.length ? 30 + 62 : 0
  medidor.font = fonte(400, 20, familiaFonte)
  const endLinhas = quebrar(medidor, dados.empresa?.endereco || '', larguraTexto)
  const contato = [dados.empresa?.telefone, dados.empresa?.email].filter(Boolean)
  const contatoLinhas = contato.flatMap(c => quebrar(medidor, c, larguraTexto))
  const alturaSelo = dados.garantia ? 96 : 0
  const alturaRodape = alturaRodapeTopo + alturaSelo + 34 + endLinhas.length * 28 + contatoLinhas.length * 28 + 20 + 40 + 40

  const ALT = Math.round(alturaTopo + 44 + alturaCorpo + alturaRodape)

  // ---------- desenha ----------
  const cv = document.createElement('canvas')
  cv.width = L * ESCALA
  cv.height = ALT * ESCALA
  const ctx = cv.getContext('2d')
  ctx.scale(ESCALA, ESCALA)
  ctx.textBaseline = 'top'

  // fundo
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, L, ALT)

  // topo em degrade
  const g = ctx.createLinearGradient(0, 0, L, alturaTopo)
  g.addColorStop(0, VERDE); g.addColorStop(1, VERDE_ESC)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, L, alturaTopo)

  let y = 62
  const cx = L / 2
  // quadrado branco com a logo
  const lado = 96
  ctx.fillStyle = '#fff'
  arredondado(ctx, cx - lado / 2, y, lado, lado, 26); ctx.fill()
  if (logo) {
    const max = 66
    const r = Math.min(max / logo.width, max / logo.height)
    const w = logo.width * r, h = logo.height * r
    ctx.drawImage(logo, cx - w / 2, y + (lado - h) / 2, w, h)
  }
  y += 96 + 26

  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,.92)'
  ctx.font = fonte(700, 21, familiaFonte)
  ctx.fillText(String(dados.status || '').toUpperCase(), cx, y)
  y += 34

  ctx.fillStyle = '#fff'
  ctx.font = fonte(800, 64, familiaFonte)
  ctx.fillText(dados.valor || '', cx, y)
  y += 74

  ctx.font = fonte(700, 24, familiaFonte)
  ctx.fillText(dados.empresa?.nome || '', cx, y)
  y += 34

  ctx.font = fonte(500, 20, familiaFonte)
  ctx.fillStyle = 'rgba(255,255,255,.85)'
  subLinhas.forEach(l => { ctx.fillText(l, cx, y); y += 28 })

  if (dados.alterada) {
    y += 8
    const tw = 118
    ctx.fillStyle = 'rgba(255,255,255,.22)'
    arredondado(ctx, cx - tw / 2, y, tw, 30, 15); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = fonte(800, 16, familiaFonte)
    ctx.fillText('ALTERADA', cx, y + 7)
    y += 38
  }

  // serrilha
  y = alturaTopo + 22
  ctx.strokeStyle = '#d8d5cc'; ctx.lineWidth = 2.5
  ctx.setLineDash([9, 9]); ctx.lineCap = 'butt'
  ctx.beginPath(); ctx.moveTo(PAD - 14, y); ctx.lineTo(L - PAD + 14, y); ctx.stroke()
  ctx.setLineDash([])
  y = alturaTopo + 44

  // corpo
  ctx.textAlign = 'left'
  blocos.forEach((b, i) => {
    ctx.fillStyle = CINZA
    ctx.font = fonte(800, 16, familiaFonte)
    ctx.fillText(String(b.rotulo).toUpperCase(), PAD, y)
    let yy = y + 20 + 17

    ctx.fillStyle = TINTA
    if (b.tipo === 'lista') {
      ctx.font = fonte(b.forte ? 700 : 500, 25, familiaFonte)
      b.itens.forEach(linhas => linhas.forEach(l => { ctx.fillText(l, PAD, yy); yy += 34 }))
    } else {
      ctx.font = fonte(b.forte ? 700 : 500, 25, familiaFonte)
      b.linhas.forEach(l => { ctx.fillText(l, PAD, yy); yy += 34 })
    }

    y += b.alt
    if (i < blocos.length - 1) {
      ctx.strokeStyle = LINHA; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(PAD, y - 10); ctx.lineTo(L - PAD, y - 10); ctx.stroke()
    }
  })

  // rodape
  const yRod = y + 10
  ctx.fillStyle = '#faf9f6'
  ctx.fillRect(0, yRod, L, ALT - yRod)
  ctx.strokeStyle = LINHA; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(0, yRod); ctx.lineTo(L, yRod); ctx.stroke()

  let yf = yRod + 30
  if (rod.length) {
    const col = (L - PAD * 2) / rod.length
    rod.forEach((r, i) => {
      const x = PAD + col * i
      ctx.fillStyle = CINZA; ctx.font = fonte(800, 15, familiaFonte)
      ctx.fillText(String(r.rotulo).toUpperCase(), x, yf)
      ctx.fillStyle = TINTA; ctx.font = fonte(600, 22, familiaFonte)
      ctx.fillText(r.valor, x, yf + 22)
    })
    yf += 62
  }

  // selo de garantia
  if (dados.garantia) {
    ctx.font = fonte(800, 21, familiaFonte)
    const lg = ctx.measureText(dados.garantia.rotulo).width
    ctx.font = fonte(500, 17, familiaFonte)
    const lv = dados.garantia.validade ? ctx.measureText('Válida até ' + dados.garantia.validade).width : 0
    const larg = Math.max(lg, lv) + 44 + 40
    const alt = 70
    const x0 = cx - larg / 2

    ctx.fillStyle = '#f2fbf7'
    arredondado(ctx, x0, yf, larg, alt, 18); ctx.fill()
    ctx.strokeStyle = VERDE; ctx.lineWidth = 3
    arredondado(ctx, x0, yf, larg, alt, 18); ctx.stroke()

    // escudo com check
    const sx = x0 + 26, sy = yf + alt / 2
    ctx.strokeStyle = VERDE; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(sx, sy - 17); ctx.lineTo(sx + 15, sy - 11); ctx.lineTo(sx + 15, sy + 2)
    ctx.quadraticCurveTo(sx + 15, sy + 14, sx, sy + 19)
    ctx.quadraticCurveTo(sx - 15, sy + 14, sx - 15, sy + 2)
    ctx.lineTo(sx - 15, sy - 11); ctx.closePath(); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(sx - 7, sy - 1); ctx.lineTo(sx - 2, sy + 4); ctx.lineTo(sx + 8, sy - 6); ctx.stroke()

    ctx.textAlign = 'left'
    ctx.fillStyle = VERDE_ESC; ctx.font = fonte(800, 21, familiaFonte)
    ctx.fillText(dados.garantia.rotulo, x0 + 52, yf + (dados.garantia.validade ? 16 : 25))
    if (dados.garantia.validade) {
      ctx.fillStyle = '#4b8f77'; ctx.font = fonte(500, 17, familiaFonte)
      ctx.fillText('Válida até ' + dados.garantia.validade, x0 + 52, yf + 42)
    }
    yf += alt + 26
  }

  // endereco + contato, centralizados
  ctx.textAlign = 'center'
  yf += 14
  ctx.fillStyle = CINZA; ctx.font = fonte(400, 20, familiaFonte)
  endLinhas.forEach(l => { ctx.fillText(l, cx, yf); yf += 28 })
  contatoLinhas.forEach(l => { ctx.fillText(l, cx, yf); yf += 28 })

  yf += 20
  ctx.fillStyle = VERDE; ctx.font = fonte(700, 21, familiaFonte)
  ctx.fillText('Obrigado pela preferência!', cx, yf)

  return cv
}

/** Canvas -> arquivo PNG */
export function canvasParaArquivo(cv, nome) {
  return new Promise(resolve => {
    cv.toBlob(b => {
      if (!b) return resolve(null)
      resolve(new File([b], nome, { type: 'image/png' }))
    }, 'image/png', 0.95)
  })
}

/** Baixa a imagem no aparelho. */
export function baixarCanvas(cv, nome) {
  const a = document.createElement('a')
  a.download = nome
  a.href = cv.toDataURL('image/png')
  a.click()
}
