/**
 * Painel de confirmacao de servico — valor, pecas, taxa e comissao.
 *
 * Fica aqui pra QUALQUER tela usar (Dashboard, Ordens de Servico, etc).
 * A regra de comissao/taxa mora so neste arquivo — se mudar, muda em todo lugar.
 *
 *   <PainelConfirmar os={osEscolhida} t={t} onFechar={...} onSalvo={...}/>
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Painel } from '../lib/painel'
import { Ico } from '../lib/icones'

// 1a taxa do dia do tecnico fica 100% empresa; da 2a em diante divide 50/50
async function ehPrimeiraTaxaDoDia(tecnicoId, dia) {
  if (!tecnicoId) return true
  const { count } = await supabase.from('ordens_servico')
    .select('id', { count: 'exact', head: true })
    .eq('tecnico_id', tecnicoId).eq('eh_taxa', true).eq('data_conclusao', dia)
  return (count || 0) === 0
}

export default function PainelConfirmar({ os, t, onFechar, onSalvo }) {
  const [valor, setValor] = useState(0)
  const [pecas, setPecas] = useState(0)
  const [taxa, setTaxa] = useState(0)
  const [ehTaxa, setEhTaxa] = useState(false)
  const [obs, setObs] = useState('')
  const [salvando, setSalvando] = useState(false)

  // recarrega os campos toda vez que abre com outra OS
  useEffect(() => {
    if (!os) return
    setValor(os.valor || 0)
    setPecas(os.valor_pecas || 0)
    setTaxa(os.valor_taxa || 0)
    setEhTaxa(!!os.eh_taxa)
    setObs(os.observacoes || '')
  }, [os && os.id])

  async function salvar() {
    if (!os) return
    setSalvando(true)
    const hoje = new Date().toISOString().split('T')[0]
    const pct = os.usuarios?.comissao_percentual || 0
    let valorFinal, valorMaoObra, valorPecasFinal, ehTaxaFinal

    if (ehTaxa) {
      valorFinal = Number(taxa) || 0
      valorPecasFinal = 0
      ehTaxaFinal = true
      if (pct === 0) {
        valorMaoObra = 0                                  // dono: 100% empresa
      } else {
        const primeira = await ehPrimeiraTaxaDoDia(os.tecnico_id, hoje)
        valorMaoObra = primeira ? 0 : valorFinal          // guarda pra dividir 50/50 depois
      }
    } else {
      const total = Number(valor) || 0
      const p = Number(pecas) || 0
      valorFinal = total
      valorPecasFinal = p
      ehTaxaFinal = false
      valorMaoObra = Math.max(total - p, 0)
    }

    const { error } = await supabase.from('ordens_servico').update({
      status: 'concluida',
      data_conclusao: hoje,
      valor: valorFinal,
      valor_pecas: valorPecasFinal,
      valor_taxa: ehTaxaFinal ? valorFinal : 0,
      eh_taxa: ehTaxaFinal,
      valor_mao_obra: valorMaoObra,
      observacoes: obs || os.observacoes,
    }).eq('id', os.id)

    setSalvando(false)
    if (error) { alert('Nao consegui salvar. Tente de novo.'); return }
    setEhTaxa(false)
    onSalvo && onSalvo()
  }

  const campo = { width:'100%', padding:'14px', borderRadius:14, border:'1px solid '+t.border,
                  fontSize:19, fontFamily:'inherit', background:t.bgInput, color:t.text, fontWeight:700,
                  fontVariantNumeric:'tabular-nums' }
  const rot = { display:'block', fontSize:10.5, color:t.textSoft, fontWeight:700, marginBottom:6,
                textTransform:'uppercase', letterSpacing:'.05em' }

  const total = Number(valor) || 0
  const p = Number(pecas) || 0
  const maoObra = Math.max(total - p, 0)
  const pct = os?.usuarios?.comissao_percentual || 0
  // o que o cliente ja adiantou (peca sob pedido) — abate do que falta receber
  const sinal = Number(os?.valor_sinal) || 0
  const aReceber = Math.max(total - sinal, 0)

  return (
    <Painel aberto={!!os} onFechar={onFechar} t={t} titulo="Confirmar serviço"
      subtitulo={os ? (os.cliente_nome + ' · ' + (os.produto || os.servico || '—')) : ''}>
      {os && (<>
        {/* aprovado x taxa */}
        <div style={{display:'flex',gap:5,marginBottom:18,background:t.bgSidebar,padding:5,borderRadius:14}}>
          <button className="sg-btn" onClick={()=>setEhTaxa(false)}
            style={{flex:1,padding:'11px',borderRadius:11,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700,
                    background:!ehTaxa?t.accent:'transparent',color:!ehTaxa?'#fff':t.textSoft,
                    display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <Ico n="confirmar" size={15}/>Serviço aprovado
          </button>
          <button className="sg-btn" onClick={()=>setEhTaxa(true)}
            style={{flex:1,padding:'11px',borderRadius:11,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700,
                    background:ehTaxa?'#9A5F0C':'transparent',color:ehTaxa?'#fff':t.textSoft}}>
            Só taxa de visita
          </button>
        </div>

        {!ehTaxa ? (
          <>
            <div style={{marginBottom:13}}>
              <label style={rot}>Valor total cobrado (R$)</label>
              <input type="number" inputMode="decimal" style={campo} value={valor} onChange={e=>setValor(e.target.value)} placeholder="0"/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={rot}>Valor de peças usadas (R$)</label>
              <input type="number" inputMode="decimal" style={campo} value={pecas} onChange={e=>setPecas(e.target.value)} placeholder="0"/>
            </div>
            {sinal > 0 && (
              <div style={{padding:'12px 14px',borderRadius:14,marginBottom:14,fontSize:13,
                           background:t.dark?'#16301C':'#E4F1E1',color:t.dark?'#6CBF7B':'#2E7A3E',
                           display:'flex',flexDirection:'column',gap:6}}>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span>Cliente já adiantou{os.data_sinal?' em '+new Date(os.data_sinal+'T12:00').toLocaleDateString('pt-BR'):''}</span>
                  <strong style={{fontVariantNumeric:'tabular-nums'}}>− R$ {sinal.toFixed(2)}</strong>
                </div>
                <div style={{borderTop:'1px solid currentColor',opacity:.25}}/>
                <div style={{display:'flex',justifyContent:'space-between',fontWeight:800}}>
                  <span>Cobrar agora do cliente</span>
                  <span style={{fontSize:17,fontVariantNumeric:'tabular-nums'}}>R$ {aReceber.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div style={{padding:'12px 14px',borderRadius:14,background:t.bgSidebar,fontSize:12.5,marginBottom:18,display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{color:t.textSoft}}>Mão de obra (total − peças)</span>
                <strong style={{color:t.text,fontVariantNumeric:'tabular-nums'}}>R$ {maoObra.toFixed(2)}</strong></div>
              {pct>0?(<>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:t.textSoft}}>Para {os.usuarios?.nome} ({pct}%)</span>
                  <strong style={{color:t.accent,fontVariantNumeric:'tabular-nums'}}>R$ {(maoObra*pct/100).toFixed(2)}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:t.textSoft}}>Para empresa{p>0?' (+ peças)':''}</span>
                  <strong style={{color:t.text,fontVariantNumeric:'tabular-nums'}}>R$ {(maoObra*(1-pct/100)+p).toFixed(2)}</strong></div>
              </>):(
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:t.textSoft}}>Para empresa (100%)</span>
                  <strong style={{color:t.text,fontVariantNumeric:'tabular-nums'}}>R$ {total.toFixed(2)}</strong></div>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{marginBottom:13}}>
              <label style={rot}>Valor da taxa (R$)</label>
              <input type="number" inputMode="decimal" style={{...campo,border:'1px solid #9A5F0C'}} value={taxa} onChange={e=>setTaxa(e.target.value)} placeholder="40"/>
            </div>
            <div style={{padding:'12px 14px',borderRadius:14,background:t.dark?'#36291A':'#F7ECD9',fontSize:12.5,color:t.dark?'#E3A94B':'#9A5F0C',marginBottom:18,lineHeight:1.5}}>
              {pct===0
                ? 'Esta taxa fica 100% para a empresa.'
                : 'Se for a 1ª taxa do dia desse técnico, fica 100% empresa. Da 2ª em diante, divide 50/50 com o técnico.'}
            </div>
          </>
        )}

        <div style={{marginBottom:18}}>
          <label style={rot}>Observações (não aparece no recibo)</label>
          <textarea style={{...campo,fontSize:14,fontWeight:400,minHeight:64,resize:'vertical'}} value={obs}
            onChange={e=>setObs(e.target.value)} placeholder="Ex: peças trocadas, garantia..."/>
        </div>

        <div style={{display:'flex',gap:10}}>
          <button className="sg-btn" onClick={onFechar}
            style={{flex:1,padding:'15px',borderRadius:14,background:'transparent',border:'1px solid '+t.border,
                    color:t.textSoft,fontSize:14,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Cancelar</button>
          <button className="sg-btn" onClick={salvar} disabled={salvando}
            style={{flex:2,padding:'15px',borderRadius:14,background:t.accent,color:'#fff',border:'none',fontSize:14,
                    cursor:salvando?'default':'pointer',fontWeight:700,fontFamily:'inherit',opacity:salvando?.7:1,
                    display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                    boxShadow:'0 8px 20px -6px '+t.accent+'99'}}>
            {salvando?'Salvando...':(<><Ico n="confirmar" size={17}/>Marcar como concluído</>)}
          </button>
        </div>
      </>)}
    </Painel>
  )
}
