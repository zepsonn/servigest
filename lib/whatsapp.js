/**
 * Monta e copia o texto da OS pro WhatsApp.
 * Fica aqui pra Dashboard e Ordens de Servico usarem exatamente o mesmo
 * formato — se mudar o texto, muda nos dois lugares de uma vez.
 */
const PERIODO_LABEL = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' }

function fmtDataBR(d) {
  if (!d) return '-'
  return new Date(d + 'T12:00').toLocaleDateString('pt-BR')
}

/** Tira espaco duplicado e sobra de pontuacao que vem do cadastro. */
function limpo(s) {
  return String(s || '').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim()
}

/** Link do Google Maps pro tecnico abrir a rota direto. */
function linkMapa(o) {
  const partes = [o.cliente_endereco, o.bairro, 'Curitiba PR'].map(limpo).filter(Boolean)
  if (!partes.length || !limpo(o.cliente_endereco)) return null
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(partes.join(', '))
}

/**
 * Texto da OS pro WhatsApp.
 * Rotulos em negrito (o WhatsApp entende *asterisco*), campo vazio nao aparece,
 * e vai um link de mapa no fim pro tecnico nao ter que copiar o endereco na mao.
 */
export function textoOS(o) {
  const servicos = String(o.servico || '').split('\n').map(s => limpo(s).replace(/^[-•]\s*/, '')).filter(Boolean)
  const quando = [fmtDataBR(o.data_entrada), o.periodo ? (PERIODO_LABEL[o.periodo] || o.periodo) : null]
    .filter(Boolean).join(' · ')
  const mapa = linkMapa(o)

  const linhas = [
    `🔧 *ORDEM DE SERVIÇO Nº ${o.numero}*`,
    '━━━━━━━━━━━━━━━━━━',
    '',
    limpo(o.cliente_nome)      ? `👤 *Cliente:* ${limpo(o.cliente_nome)}` : null,
    limpo(o.cliente_telefone)  ? `📱 *Telefone:* ${limpo(o.cliente_telefone)}` : null,
    limpo(o.cliente_endereco)  ? `📍 *Endereço:* ${limpo(o.cliente_endereco)}` : null,
    limpo(o.bairro)            ? `🏘️ *Bairro:* ${limpo(o.bairro)}` : null,
    quando                     ? `📅 *Data:* ${quando}` : null,
    o.usuarios?.nome           ? `🧰 *Técnico:* ${o.usuarios.nome}` : null,
    '',
    limpo(o.produto)           ? `❄️ *Aparelho:* ${limpo(o.produto)}` : null,
    limpo(o.relato_cliente)    ? `💬 *Relato do cliente:* ${limpo(o.relato_cliente)}` : null,
    limpo(o.descricao)         ? `🔎 *Diagnóstico:* ${limpo(o.descricao)}` : null,
    servicos.length > 1        ? `🛠️ *Serviços:*\n${servicos.map(s => '   • ' + s).join('\n')}`
      : servicos.length === 1  ? `🛠️ *Serviço:* ${servicos[0]}` : null,
    Number(o.valor) > 0        ? `💰 *Valor:* ${Number(o.valor).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}` : null,
    mapa ? '' : null,
    mapa ? `🗺️ *Como chegar:*\n${mapa}` : null,
  ]

  // tira linha em branco repetida ou sobrando no fim
  return linhas.filter(l => l !== null)
    .join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** Copia pra area de transferencia. Devolve true se deu certo. */
export async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch (e) {
    // navegador sem permissao de clipboard (ou http) — usa o jeito antigo
    try {
      const ta = document.createElement('textarea')
      ta.value = texto
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch (e2) { return false }
  }
}

/** Copia a OS e devolve true/false. */
export async function copiarOS(o) {
  return copiarTexto(textoOS(o))
}

/** Abre a conversa do cliente no WhatsApp com o texto pronto. */
export function abrirWhatsApp(o) {
  let num = String(o.cliente_telefone || '').replace(/[^0-9]/g, '')
  if (num.startsWith('55')) num = num.slice(2)
  if (num.length === 10) num = num.slice(0, 2) + '9' + num.slice(2)
  if (num.length < 10) return false
  window.open('https://wa.me/55' + num + '?text=' + encodeURIComponent(textoOS(o)), '_blank')
  return true
}
