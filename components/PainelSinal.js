/**
 * Painel de "peça sob pedido": registra o que o cliente adiantou e coloca
 * a OS em "aguardando peça".
 *
 * O sinal NAO entra no faturamento — e dinheiro de uma peca que ainda pode
 * nem ter chegado. Ele so e abatido do total quando a OS fecha.
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Painel } from '../lib/painel'
import { Ico } from '../lib/icones'

const hojeISO = () => new Date().toISOString().split('T')[0]

export default function PainelSinal({ os, t, onFechar, onSalvo }) {
  const [peca, setPeca] = useState('')
  const [sinal, setSinal] = useState('')
  const [dataSinal, setDataSinal] = useState(hojeISO())
  const [total, setTotal] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!os) return
    setPeca(os.peca_pedida || '')
    setSinal(os.valor_sinal || '')
    setDataSinal(os.data_sinal || hojeISO())
    setTotal(os.valor || '')
  }, [os && os.id])

  const vSinal = Number(sinal) || 0
  const vTotal = Number(total) || 0
  const falta = Math.max(vTotal - vSinal, 0)

  async function salvar() {
    if (!os) return
    if (vSinal <= 0) { alert('Informe quanto o cliente adiantou.'); return }
    setSalvando(true)
    const { error } = await supabase.from('ordens_servico').update({
      status: 'aguardando_peca',
      valor_sinal: vSinal,
      data_sinal: dataSinal || hojeISO(),
      peca_pedida: peca || null,
      valor: vTotal || os.valor || 0,
    }).eq('id', os.id)
    setSalvando(false)
    if (error) { alert('Nao consegui salvar. Tente de novo.'); return }
    onSalvo && onSalvo()
  }

  async function cancelarEspera() {
    if (!os) return
    if (!confirm('Voltar esta OS para "em andamento"?\nO sinal registrado continua salvo.')) return
    setSalvando(true)
    await supabase.from('ordens_servico').update({ status: 'em_andamento' }).eq('id', os.id)
    setSalvando(false)
    onSalvo && onSalvo()
  }

  // Aviso pro cliente: serve de comprovante do adiantamento e tira a ansiedade
  // de quem pagou e ficou esperando sem noticia.
  function avisarCliente() {
    const primeiroNome = String(os.cliente_nome || '').trim().split(/\s+/)[0] || 'tudo bem'
    const brl = n => Number(n || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' })
    const dataBR = d => d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : ''

    const msg = [
      '*Top Eletro - Inova*',
      '━━━━━━━━━━━━━━━━━━',
      '',
      `Olá, ${primeiroNome}! Passando pra te dar um retorno 👍`,
      '',
      'Sua peça já foi *encomendada* e estamos acompanhando a entrega junto ao fornecedor.',
      '',
      peca ? `📦 *Peça:* ${peca}` : null,
      os.produto ? `❄️ *Aparelho:* ${os.produto}` : null,
      `📋 *Ordem de Serviço:* Nº ${os.numero}`,
      '',
      '*Pagamento*',
      `✅ Adiantado${dataSinal ? ' em ' + dataBR(dataSinal) : ''}: ${brl(vSinal)}`,
      falta > 0 ? `💰 A pagar na entrega: ${brl(falta)}` : '✅ Serviço totalmente pago',
      '',
      'Assim que a peça chegar entramos em contato pra agendar a instalação.',
      'Qualquer dúvida, é só chamar por aqui!',
      '',
      'Obrigado pela confiança 🙏',
      '(41) 99846-1851',
    ].filter(l => l !== null).join('\n')

    let num = String(os.cliente_telefone || '').replace(/[^0-9]/g, '')
    if (num.startsWith('55')) num = num.slice(2)
    if (num.length === 10) num = num.slice(0, 2) + '9' + num.slice(2)
    const url = num.length >= 10
      ? 'https://wa.me/55' + num + '?text=' + encodeURIComponent(msg)
      : 'https://wa.me/?text=' + encodeURIComponent(msg)
    window.open(url, '_blank')
  }

  const campo = { width:'100%', padding:'13px 14px', borderRadius:13, border:'1px solid '+t.border,
                  fontSize:17, fontFamily:'inherit', background:t.bgInput, color:t.text, fontWeight:700,
                  fontVariantNumeric:'tabular-nums' }
  const rot = { display:'block', fontSize:10.5, color:t.textSoft, fontWeight:700, marginBottom:6,
                textTransform:'uppercase', letterSpacing:'.05em' }

  return (
    <Painel aberto={!!os} onFechar={onFechar} t={t} titulo="Peça sob pedido"
      subtitulo={os ? (os.cliente_nome + ' · ' + (os.produto || '—')) : ''}>
      {os && (<>
        <div style={{marginBottom:14}}>
          <label style={rot}>Peça encomendada</label>
          <input value={peca} onChange={e=>setPeca(e.target.value)} placeholder="Ex: Placa de potência Bwk12"
            style={{...campo, fontSize:14.5, fontWeight:500}}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          <div>
            <label style={rot}>Valor total do serviço</label>
            <input type="number" inputMode="decimal" value={total} onChange={e=>setTotal(e.target.value)} placeholder="0" style={campo}/>
          </div>
          <div>
            <label style={rot}>Cliente adiantou</label>
            <input type="number" inputMode="decimal" value={sinal} onChange={e=>setSinal(e.target.value)} placeholder="0"
              style={{...campo, borderColor:t.accent}}/>
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <label style={rot}>Data do pagamento</label>
          <input type="date" value={dataSinal} onChange={e=>setDataSinal(e.target.value)}
            style={{...campo, fontSize:15, fontWeight:500}}/>
        </div>

        <div style={{padding:'13px 15px',borderRadius:14,background:t.bgSidebar,fontSize:13,marginBottom:18,
                     display:'flex',flexDirection:'column',gap:7}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:t.textSoft}}>Total do serviço</span>
            <strong style={{color:t.text,fontVariantNumeric:'tabular-nums'}}>R$ {vTotal.toFixed(2)}</strong>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:t.textSoft}}>Já pago pelo cliente</span>
            <strong style={{color:t.accent,fontVariantNumeric:'tabular-nums'}}>− R$ {vSinal.toFixed(2)}</strong>
          </div>
          <div style={{borderTop:'1px solid '+t.border,paddingTop:7,display:'flex',justifyContent:'space-between'}}>
            <span style={{color:t.text,fontWeight:700}}>Falta receber na entrega</span>
            <strong style={{color:t.text,fontSize:17,fontVariantNumeric:'tabular-nums'}}>R$ {falta.toFixed(2)}</strong>
          </div>
        </div>

        <div style={{padding:'11px 14px',borderRadius:12,background:t.dark?'#36291A':'#F7ECD9',
                     fontSize:12,color:t.dark?'#E3A94B':'#9A5F0C',marginBottom:18,lineHeight:1.5}}>
          O sinal fica guardado separado e <b>não entra no faturamento agora</b> — ele é abatido
          quando você fechar a OS.
        </div>

        {vSinal > 0 && (
          <button className="sg-btn" onClick={avisarCliente}
            style={{width:'100%',padding:'14px',borderRadius:14,marginBottom:12,border:'1px solid #25D366',
                    background:'#25D366',color:'#fff',fontSize:13.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
            <Ico n="whatsapp" size={18}/>Avisar cliente no WhatsApp
          </button>
        )}

        <div style={{display:'flex',gap:10}}>
          {os.status === 'aguardando_peca' ? (
            <button className="sg-btn" onClick={cancelarEspera} disabled={salvando}
              style={{flex:1,padding:'15px',borderRadius:14,background:'transparent',border:'1px solid '+t.border,
                      color:t.textSoft,fontSize:13.5,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>
              Peça chegou
            </button>
          ) : (
            <button className="sg-btn" onClick={onFechar}
              style={{flex:1,padding:'15px',borderRadius:14,background:'transparent',border:'1px solid '+t.border,
                      color:t.textSoft,fontSize:14,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Cancelar</button>
          )}
          <button className="sg-btn" onClick={salvar} disabled={salvando}
            style={{flex:2,padding:'15px',borderRadius:14,background:t.accent,color:'#fff',border:'none',fontSize:14,
                    cursor:salvando?'default':'pointer',fontWeight:700,fontFamily:'inherit',opacity:salvando?.7:1,
                    display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                    boxShadow:'0 8px 20px -6px '+t.accent+'99'}}>
            {salvando ? 'Salvando...' : (<><Ico n="confirmar" size={17}/>Registrar sinal</>)}
          </button>
        </div>
      </>)}
    </Painel>
  )
}
