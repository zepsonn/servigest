/**
 * Varios aparelhos na mesma OS.
 *
 * A OS guarda em `aparelhos` (jsonb) uma lista:
 *   [{ nome, servico, valor }]
 *
 * As colunas antigas `produto` e `servico` continuam sendo gravadas
 * (montadas a partir dessa lista) — assim o resto do sistema (dashboard,
 * etiquetas, busca, WhatsApp) e as 481 OS antigas nao mudam nada.
 *
 * OS antiga (so texto) e lida de volta pela derivarDoTexto(), entao da pra
 * abrir qualquer OS no editor de aparelhos sem redigitar.
 */
import { agruparServicos } from './servicos'

export const APARELHO0 = { nome: '', servico: '', valor: '' }

/** Quebra um campo multilinha em itens, tirando marcador solto. */
export function itensDe(texto) {
  return String(texto || '').split('\n').map(s => s.trim().replace(/^[-•]\s*/, '')).filter(Boolean)
}

/** Junta um campo multilinha numa linha so, pros cards do sistema. */
export function umaLinha(texto) {
  return itensDe(texto).join(' · ')
}

/** OS antiga: separa pelo cabecalho que ja existe no campo de servico. */
export function derivarDoTexto(produto, servico) {
  const partes = agruparServicos(servico)
  const nomes = itensDe(produto)
  const grupos = []
  partes.forEach(p => {
    if (p.tipo === 'titulo') grupos.push({ nome: p.texto, itens: [] })
    else {
      if (!grupos.length) grupos.push({ nome: '', itens: [] })
      grupos[grupos.length - 1].itens.push(p.texto)
    }
  })
  const soltos = grupos.length ? grupos[0].itens.join('\n') : ''

  // ja tinha cabecalho de aparelho no texto -> cada um vira um bloco
  if (grupos.some(g => g.nome)) {
    return grupos.map((g, i) => ({ nome: g.nome || nomes[i] || '', servico: g.itens.join('\n'), valor: '' }))
  }
  // sem cabecalho, mas varios aparelhos no campo Produto
  if (nomes.length > 1) {
    return nomes.map((n, i) => ({ nome: n, servico: i === 0 ? soltos : '', valor: '' }))
  }
  return [{ nome: nomes[0] || '', servico: soltos, valor: '' }]
}

/** A lista de aparelhos da OS (sempre com pelo menos um bloco, pro editor). */
export function lerAparelhos(os) {
  if (!os) return [{ ...APARELHO0 }]
  const lista = Array.isArray(os.aparelhos) ? os.aparelhos : null
  if (lista && lista.length) {
    return lista.map(a => ({
      nome: String(a && a.nome || ''),
      servico: String(a && a.servico || ''),
      valor: a && a.valor != null && a.valor !== '' ? String(a.valor) : '',
    }))
  }
  return derivarDoTexto(os.produto, os.servico)
}

/** Tira os aparelhos vazios e normaliza o valor. */
export function limpar(lista) {
  return (lista || []).map(a => ({
    nome: String(a && a.nome || '').trim(),
    servico: String(a && a.servico || '').replace(/\s+$/, ''),
    valor: !a || a.valor === '' || a.valor == null ? null : (Number(a.valor) || 0),
  })).filter(a => a.nome || a.servico)
}

/** Campo `produto` (legado): um nome por linha. */
export function textoProduto(lista) {
  return limpar(lista).map(a => a.nome).filter(Boolean).join('\n')
}

/**
 * Campo `servico` (legado): quando tem mais de um aparelho, o nome dele vira
 * cabecalho terminado em ":" — que e exatamente o que agruparServicos() le.
 */
export function textoServico(lista) {
  const aps = limpar(lista)
  const varios = aps.filter(a => a.nome).length > 1
  const out = []
  aps.forEach(a => {
    if (varios && a.nome) out.push(a.nome + ':')
    itensDe(a.servico).forEach(i => out.push(i))
  })
  return out.join('\n')
}

/** Soma dos valores preenchidos por aparelho (0 se ninguem preencheu). */
export function somaAparelhos(lista) {
  return limpar(lista).reduce((s, a) => s + (Number(a.valor) || 0), 0)
}

/** Os tres campos que vao pro banco de uma vez. */
export function camposDaOS(lista) {
  const aps = limpar(lista)
  return {
    aparelhos: aps.length ? aps : null,
    produto: textoProduto(aps),
    servico: textoServico(aps),
  }
}
