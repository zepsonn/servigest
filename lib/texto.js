import { createElement, Fragment } from 'react'

/**
 * Formatacao de texto no padrao do WhatsApp — assim o MESMO texto funciona
 * no recibo (virando negrito de verdade) e no WhatsApp (que ja entende sozinho).
 *
 *   *negrito*      _italico_      ~riscado~
 */

export const MARCADORES = [
  { chave: 'negrito', marca: '*', rotulo: 'N',  estilo: { fontWeight: 700 } },
  { chave: 'italico', marca: '_', rotulo: 'I',  estilo: { fontStyle: 'italic' } },
  { chave: 'riscado', marca: '~', rotulo: 'S',  estilo: { textDecoration: 'line-through' } },
]

// quebra o texto em pedacos com o estilo de cada um
function analisar(texto) {
  const partes = []
  let buffer = ''
  let i = 0
  const s = String(texto || '')

  while (i < s.length) {
    const c = s[i]
    const m = MARCADORES.find(x => x.marca === c)
    if (m) {
      const fim = s.indexOf(m.marca, i + 1)
      // so vale como marcador se fechar na mesma linha e tiver conteudo
      const miolo = fim > i + 1 ? s.slice(i + 1, fim) : null
      if (miolo && !miolo.includes('\n')) {
        if (buffer) { partes.push({ texto: buffer, estilo: null }); buffer = '' }
        partes.push({ texto: miolo, estilo: m.estilo })
        i = fim + 1
        continue
      }
    }
    buffer += c
    i++
  }
  if (buffer) partes.push({ texto: buffer, estilo: null })
  return partes
}

/**
 * Renderiza o texto ja formatado. Preserva as quebras de linha.
 * Uso:  <TextoFormatado texto={form.servico} />
 */
export function TextoFormatado({ texto, style }) {
  const partes = analisar(texto)
  return createElement(
    'span',
    { style: { whiteSpace: 'pre-wrap', ...(style || {}) } },
    partes.map((p, i) =>
      p.estilo
        ? createElement('span', { key: i, style: p.estilo }, p.texto)
        : createElement(Fragment, { key: i }, p.texto)
    )
  )
}

/**
 * Envolve o trecho selecionado do textarea com a marca escolhida.
 * Devolve { valor, inicio, fim } pra reposicionar o cursor.
 */
export function aplicarMarca(valor, inicio, fim, marca) {
  const v = String(valor || '')
  if (inicio === fim) {
    // nada selecionado — insere o par e deixa o cursor no meio
    return { valor: v.slice(0, inicio) + marca + marca + v.slice(fim), inicio: inicio + 1, fim: inicio + 1 }
  }
  const sel = v.slice(inicio, fim)
  // se ja estiver marcado, desmarca
  if (sel.startsWith(marca) && sel.endsWith(marca) && sel.length > 2) {
    const limpo = sel.slice(1, -1)
    return { valor: v.slice(0, inicio) + limpo + v.slice(fim), inicio, fim: inicio + limpo.length }
  }
  const novo = marca + sel + marca
  return { valor: v.slice(0, inicio) + novo + v.slice(fim), inicio, fim: inicio + novo.length }
}
