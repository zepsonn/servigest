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

/** Texto da OS, pronto pra colar no WhatsApp. */
export function textoOS(o) {
  const servicos = String(o.servico || '').split('\n').map(s => s.trim()).filter(Boolean)
  const linhas = [
    `*OS Nº ${o.numero}*`,
    `Cliente: ${o.cliente_nome || '-'}`,
    o.cliente_telefone ? `Telefone: ${o.cliente_telefone}` : null,
    `Endereço: ${o.cliente_endereco || '-'}${o.bairro ? ' - ' + o.bairro : ''}`,
    `Data: ${fmtDataBR(o.data_entrada)}${o.periodo ? ' (' + (PERIODO_LABEL[o.periodo] || o.periodo) + ')' : ''}`,
    o.produto ? `Produto: ${o.produto}` : null,
    servicos.length > 1 ? 'Serviços realizados:\n' + servicos.map(s => '- ' + s).join('\n')
      : servicos.length === 1 ? `Serviço: ${servicos[0]}` : null,
    o.relato_cliente ? `Relato do cliente: ${o.relato_cliente}` : null,
    o.descricao ? `Diagnóstico: ${o.descricao}` : null,
  ]
  return linhas.filter(Boolean).join('\n')
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
