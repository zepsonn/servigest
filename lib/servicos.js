/**
 * Servicos padronizados da Top Eletro - Inova.
 *
 * Montado a partir das 481 OS ja feitas: peguei o que mais se repete e
 * unifiquei a escrita (antes tinha "- Gas", "-Gas", "Carga de Gas" e
 * "-Carga de Gas" como se fossem coisas diferentes).
 *
 * Isso alimenta os botoes de sugestao no campo de servico.
 */

export const GRUPOS_SERVICO = [
  {
    grupo: 'Refrigeração',
    cor: '#2F80ED',
    itens: [
      'Carga de gás',
      'Troca do compressor',
      'Troca do filtro secador',
      'Troca do capilar',
      'Troca do termostato',
      'Troca do sensor de temperatura',
      'Troca da resistência de degelo',
      'Troca do damper',
      'Troca do motor do ventilador',
      'Troca da placa eletrônica',
      'Solda no sistema',
      'Localização de vazamento',
      'Troca do isopor / isolamento',
      'Troca da borracha da porta',
    ],
  },
  {
    grupo: 'Lavadora / Lava e seca',
    cor: '#7EE8FA',
    itens: [
      'Troca da eletrobomba',
      'Troca da placa de potência',
      'Troca da placa de interface',
      'Troca da válvula de entrada',
      'Troca do mecanismo',
      'Troca do rolamento',
      'Troca do retentor',
      'Troca da correia',
      'Troca da polia',
      'Troca do amortecedor',
      'Troca dos tirantes de suspensão',
      'Troca da trava da tampa',
      'Troca da mangueira',
      'Troca do atuador de acoplamento',
      'Limpeza do tanque',
    ],
  },
  {
    grupo: 'Micro-ondas',
    cor: '#FF5E62',
    itens: [
      'Troca do magnetron',
      'Troca do diodo',
      'Troca do capacitor',
      'Troca da microchave',
      'Troca do termostato',
      'Troca do motor do prato',
      'Troca do transformador',
    ],
  },
  {
    grupo: 'Atendimento',
    cor: '#a955ff',
    itens: [
      'Orçamento',
      'Visita técnica',
      'Retorno em garantia',
      'Recolhimento do aparelho',
      'Entrega do aparelho',
      'Limpeza geral / higienização',
      'Revisão preventiva',
      'Instalação',
    ],
  },
]

/** Lista achatada, pra busca e sugestao. */
export const SERVICOS_PADRAO = GRUPOS_SERVICO.flatMap(g => g.itens)

/** Garantias que costumam ir no recibo. */
export const GARANTIAS = [
  '*GARANTIA DE 90 DIAS*',
  '*GARANTIA DE 01 ANO*',
  '*GARANTIA DE 30 DIAS*',
  'Sem garantia (peça do cliente)',
]

/** De que grupo é esse serviço (pra colorir a etiqueta). */
export function grupoDoServico(txt) {
  const t = String(txt || '').toLowerCase()
  for (const g of GRUPOS_SERVICO) {
    if (g.itens.some(i => t.includes(i.toLowerCase()))) return g
  }
  return null
}
