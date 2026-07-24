import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { LOGO_SRC } from '../lib/logo'

const GARANTIA_PADRAO = '90 dias contra defeitos de fabricacao, conforme o Codigo de Defesa do Consumidor.'

const CSS_PRINT = `
body{font-family:Arial,Helvetica,sans-serif;padding:30px;color:#1a1a1a;max-width:720px;margin:0 auto}
.rv-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #e0e0e0}
.rv-logo{width:56px;height:56px;border-radius:8px;object-fit:contain;border:1px solid #f0f0f0}
.rv-badge{background:#1D9E75;color:#fff;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:700;display:inline-block;margin-bottom:4px}
.rv-num{font-size:20px;font-weight:700;color:#1D9E75}
.rv-sec{margin-bottom:14px}
.rv-sec-title{font-size:10px;font-weight:700;text-transform:uppercase;color:#aaa;margin-bottom:8px;letter-spacing:.05em}
.rv-table{width:100%;border-collapse:collapse;font-size:13px}
.rv-table th{text-align:left;color:#999;font-weight:600;font-size:10.5px;text-transform:uppercase;border-bottom:1px solid #e0e0e0;padding:7px 8px}
.rv-table td{padding:8px;border-bottom:1px solid #f1f1f1}
.rv-right{text-align:right}
.rv-tot{display:flex;justify-content:space-between;padding:4px 2px;font-size:13px;color:#555}
.rv-dif{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-radius:8px;margin-top:8px}
.rv-dif .lbl{font-size:13px;color:#555}
.rv-dif .val{font-size:20px;font-weight:700}
.rv-block{margin-top:12px;padding:12px 14px;background:#f9f9f7;border-radius:8px;border:1px solid #eee;font-size:12.5px;color:#333;line-height:1.5}
.rv-block .bt{display:block;font-size:10px;text-transform:uppercase;color:#aaa;margin-bottom:4px;letter-spacing:.05em;font-weight:700}
.rv-foot{margin-top:22px;padding-top:14px;border-top:1px dashed #e0e0e0;text-align:center;font-size:11.5px;color:#888}
@media print{body{padding:16px}}
`

export default function ReciboVenda() {
  const { t } = useTheme()
  const [empresa, setEmpresa] = useState({nome:'Top Eletro - Inova',cnpj:'82.668.070/0001-87',cidade:'Rua Professor Joao Barcelos, 2273 - Loja 02, Bairro Hauer - Curitiba, PR',telefone:'(41) 99846-1851 / 3206-7414',email:'tecnicainova@outlook.com'})
  const [numero, setNumero] = useState(()=>'V'+String(Date.now()).slice(-6))
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [cliente, setCliente] = useState({nome:'',telefone:''})
  const [itens, setItens] = useState([{descricao:'',qtd:1,valor:''}])
  const [troca, setTroca] = useState({valor:'',descricao:''})
  const [pagamento, setPagamento] = useState('')
  const [obs, setObs] = useState('')
  const [garantiaOn, setGarantiaOn] = useState(true)
  const [garantiaTexto, setGarantiaTexto] = useState(GARANTIA_PADRAO)
  const [especOn, setEspecOn] = useState(false)
  const [especTexto, setEspecTexto] = useState('')

  useEffect(()=>{
    supabase.from('empresa').select('*').single().then(({data})=>{ if(data) setEmpresa(prev=>({...prev,...data})) })
  },[])

  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const fmtDate = d => d ? new Date(d+'T12:00').toLocaleDateString('pt-BR') : '-'

  const totalProdutos = itens.reduce((s,it)=>s+(Number(it.qtd||0)*Number(it.valor||0)),0)
  const valorTroca = Number(troca.valor||0)
  const diferenca = totalProdutos - valorTroca
  const itensValidos = itens.filter(it=>it.descricao||Number(it.valor||0)>0)

  function difInfo(){
    if(Math.abs(diferenca)<0.005) return {label:'Tudo quitado na troca', valor:0, cor:'#555', bg:'#f4f4f2', bd:'#e0e0e0'}
    if(diferenca>0) return {label:'Cliente paga', valor:diferenca, cor:'#1D9E75', bg:'#f4faf7', bd:'#1D9E75'}
    return {label:'A devolver ao cliente', valor:Math.abs(diferenca), cor:'#B4560C', bg:'#fdf3ea', bd:'#E2900A'}
  }
  const dif = difInfo()

  function setItem(i,campo,v){ setItens(itens.map((it,idx)=>idx===i?{...it,[campo]:v}:it)) }
  function addItem(){ setItens([...itens,{descricao:'',qtd:1,valor:''}]) }
  function delItem(i){ if(itens.length>1) setItens(itens.filter((_,idx)=>idx!==i)) }

  function formatarTelBR(tel){ let num=(tel||'').replace(/[^0-9]/g,''); if(num.startsWith('55'))num=num.slice(2); if(num.length===10)num=num.slice(0,2)+'9'+num.slice(2); return '55'+num }

  function sendWhatsApp(){
    const tel=formatarTelBR(cliente.telefone)
    if(tel.length<12){alert('Telefone do cliente invalido ou vazio.');return}
    const linha='================================'
    const L=[empresa.nome,linha,'RECIBO DE VENDA - N. '+numero,linha,'',
      'Cliente: '+(cliente.nome||'-'),'Data: '+fmtDate(data),'','PRODUTOS:']
    itensValidos.forEach(it=>L.push('- '+(it.qtd||1)+'x '+(it.descricao||'item')+'  '+fmt(Number(it.qtd||0)*Number(it.valor||0))))
    L.push('','Total dos produtos: '+fmt(totalProdutos))
    if(valorTroca>0){ L.push('Troca'+(troca.descricao?' ('+troca.descricao+')':'')+': -'+fmt(valorTroca)) }
    L.push(dif.label+': '+fmt(dif.valor))
    if(pagamento) L.push('Pagamento: '+pagamento)
    if(obs) L.push('','Obs: '+obs)
    if(garantiaOn&&garantiaTexto) L.push('','Garantia: '+garantiaTexto)
    if(especOn&&especTexto) L.push('','Especificacoes: '+especTexto)
    L.push('',linha,'Obrigado pela preferencia!',empresa.nome,'Tel: '+(empresa.telefone||''))
    window.open('https://wa.me/'+tel+'?text='+encodeURIComponent(L.join('\n')),'_blank')
  }

  function imprimir(){
    const el=document.getElementById('recibo-venda-print')
    if(!el) return
    const janela=window.open('','_blank','width=800,height=600')
    janela.document.write('<html><head><title>Recibo de Venda '+numero+'</title><style>'+CSS_PRINT+'</style></head><body>')
    janela.document.write(el.innerHTML)
    janela.document.write('</body></html>')
    janela.document.close()
    setTimeout(()=>janela.print(),400)
  }

  // estilos do formulario (usam o tema)
  const inp={width:'100%',padding:'9px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit',background:t.bgInput,color:t.text}
  const lbl={display:'block',fontSize:11,color:t.textSoft,fontWeight:600,marginBottom:4}
  const sec={fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:t.textSoft,margin:'18px 0 10px',paddingBottom:6,borderBottom:'1px solid '+t.borderSoft}
  const btnGh={display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,border:'1px solid '+t.border,background:t.bgCard,color:t.text,fontSize:13,cursor:'pointer',fontFamily:'inherit',fontWeight:500}

  return (
    <Layout title="Recibo de Venda">
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:20,alignItems:'start'}} className="rv-cols">
        <style>{`@media(max-width:900px){.rv-cols{grid-template-columns:1fr !important}}`}</style>

        {/* ================= FORMULARIO ================= */}
        <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,boxShadow:t.shadow,padding:'18px 20px'}}>
          <div style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:4}}>Preencher recibo</div>
          <div style={{fontSize:12,color:t.textSoft}}>Os campos aparecem no recibo ao lado em tempo real.</div>

          <div style={sec}>Recibo</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div><label style={lbl}>Numero</label><input style={inp} value={numero} onChange={e=>setNumero(e.target.value)}/></div>
            <div><label style={lbl}>Data</label><input type="date" style={inp} value={data} onChange={e=>setData(e.target.value)}/></div>
          </div>

          <div style={sec}>Cliente</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div><label style={lbl}>Nome</label><input style={inp} value={cliente.nome} onChange={e=>setCliente({...cliente,nome:e.target.value})} placeholder="Nome do cliente"/></div>
            <div><label style={lbl}>Telefone (p/ WhatsApp)</label><input style={inp} value={cliente.telefone} onChange={e=>setCliente({...cliente,telefone:e.target.value})} placeholder="(41) 9....."/></div>
          </div>

          <div style={sec}>Produtos</div>
          {itens.map((it,i)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 56px 90px 30px',gap:6,marginBottom:8,alignItems:'center'}}>
              <input style={inp} value={it.descricao} onChange={e=>setItem(i,'descricao',e.target.value)} placeholder="Produto / descricao"/>
              <input type="number" min="1" style={{...inp,padding:'9px 6px',textAlign:'center'}} value={it.qtd} onChange={e=>setItem(i,'qtd',e.target.value)} title="Quantidade"/>
              <input type="number" step="0.01" style={{...inp,padding:'9px 8px'}} value={it.valor} onChange={e=>setItem(i,'valor',e.target.value)} placeholder="Vl. un"/>
              <button onClick={()=>delItem(i)} title="Remover" style={{border:'none',background:'transparent',color:itens.length>1?'#A32D2D':t.borderSoft,cursor:itens.length>1?'pointer':'default',fontSize:18,lineHeight:1}}>×</button>
            </div>
          ))}
          <button onClick={addItem} style={{...btnGh,marginTop:2,fontSize:12,padding:'7px 12px'}}>+ Adicionar produto</button>

          <div style={sec}>Troca / Transferencia (opcional)</div>
          <div style={{fontSize:11.5,color:t.textSoft,marginBottom:8,lineHeight:1.5}}>Valor do produto que o cliente entregou na troca. O sistema calcula se ele te paga a diferenca ou se voce devolve troco pra ele.</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 130px',gap:10}}>
            <div><label style={lbl}>O que o cliente deu</label><input style={inp} value={troca.descricao} onChange={e=>setTroca({...troca,descricao:e.target.value})} placeholder="Ex: Micro-ondas usado"/></div>
            <div><label style={lbl}>Valor da troca</label><input type="number" step="0.01" style={inp} value={troca.valor} onChange={e=>setTroca({...troca,valor:e.target.value})} placeholder="0,00"/></div>
          </div>

          <div style={sec}>Detalhes</div>
          <div style={{marginBottom:10}}>
            <label style={lbl}>Forma de pagamento</label>
            <select style={inp} value={pagamento} onChange={e=>setPagamento(e.target.value)}>
              <option value="">Nao informar</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Pix">Pix</option>
              <option value="Cartao de debito">Cartao de debito</option>
              <option value="Cartao de credito">Cartao de credito</option>
              <option value="Cartao parcelado">Cartao parcelado</option>
            </select>
          </div>
          <div style={{marginBottom:4}}><label style={lbl}>Observacoes</label><textarea style={{...inp,minHeight:56,resize:'vertical'}} value={obs} onChange={e=>setObs(e.target.value)} placeholder="Ex: entrega combinada, condicoes..."/></div>

          <div style={sec}>Garantia e especificacoes</div>
          <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:t.text,cursor:'pointer',marginBottom:8}}>
            <input type="checkbox" checked={garantiaOn} onChange={e=>setGarantiaOn(e.target.checked)} style={{width:16,height:16,accentColor:t.accent,cursor:'pointer'}}/>
            Incluir <strong>garantia</strong> no recibo
          </label>
          {garantiaOn&&<textarea style={{...inp,minHeight:52,resize:'vertical',marginBottom:12}} value={garantiaTexto} onChange={e=>setGarantiaTexto(e.target.value)}/>}
          <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:t.text,cursor:'pointer',marginBottom:8}}>
            <input type="checkbox" checked={especOn} onChange={e=>setEspecOn(e.target.checked)} style={{width:16,height:16,accentColor:t.accent,cursor:'pointer'}}/>
            Incluir <strong>especificacoes</strong> no recibo
          </label>
          {especOn&&<textarea style={{...inp,minHeight:52,resize:'vertical'}} value={especTexto} onChange={e=>setEspecTexto(e.target.value)} placeholder="Marca, modelo, voltagem, cor, numero de serie..."/>}
        </div>

        {/* ================= PREVIEW / IMPRESSAO ================= */}
        <div>
          <div style={{display:'flex',gap:8,marginBottom:12,justifyContent:'flex-end',flexWrap:'wrap'}}>
            <button style={btnGh} onClick={imprimir}>Imprimir / PDF</button>
            <button style={{...btnGh,background:'#25D366',color:'#fff',border:'1px solid #25D366'}} onClick={sendWhatsApp}>Enviar WhatsApp</button>
          </div>

          <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,boxShadow:t.shadow,padding:22}}>
            {/* tudo aqui dentro imprime — cores fixas de "papel", independente do tema */}
            <div id="recibo-venda-print" style={{background:'#fff',color:'#1a1a1a',borderRadius:8,padding:6}}>
              <div className="rv-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,paddingBottom:16,borderBottom:'2px solid #e0e0e0'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <img src={LOGO_SRC} className="rv-logo" alt="logo" style={{width:56,height:56,borderRadius:8,objectFit:'contain',border:'1px solid #f0f0f0'}}/>
                  <div>
                    <div style={{fontSize:17,fontWeight:700,color:'#1a1a1a'}}>{empresa.nome}</div>
                    <div style={{fontSize:11,color:'#888'}}>CNPJ: {empresa.cnpj}</div>
                    <div style={{fontSize:11,color:'#888'}}>{empresa.cidade}</div>
                    <div style={{fontSize:11,color:'#888'}}>{empresa.telefone} - {empresa.email}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="rv-badge" style={{background:'#1D9E75',color:'#fff',padding:'3px 10px',borderRadius:4,fontSize:10,fontWeight:700,display:'inline-block',marginBottom:4}}>RECIBO DE VENDA</div>
                  <div className="rv-num" style={{fontSize:20,fontWeight:700,color:'#1D9E75'}}>N. {numero}</div>
                  <div style={{fontSize:11,color:'#888'}}>Data: {fmtDate(data)}</div>
                </div>
              </div>

              {cliente.nome&&(
                <div className="rv-sec" style={{marginBottom:14}}>
                  <div className="rv-sec-title" style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#aaa',marginBottom:6,letterSpacing:'.05em'}}>Cliente</div>
                  <div style={{fontSize:13,color:'#333'}}>{cliente.nome}{cliente.telefone?' · '+cliente.telefone:''}</div>
                </div>
              )}

              <div className="rv-sec" style={{marginBottom:14}}>
                <div className="rv-sec-title" style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#aaa',marginBottom:8,letterSpacing:'.05em'}}>Produtos</div>
                <table className="rv-table" style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr>
                    <th style={{textAlign:'left',color:'#999',fontWeight:600,fontSize:10.5,textTransform:'uppercase',borderBottom:'1px solid #e0e0e0',padding:'7px 8px'}}>Qtd</th>
                    <th style={{textAlign:'left',color:'#999',fontWeight:600,fontSize:10.5,textTransform:'uppercase',borderBottom:'1px solid #e0e0e0',padding:'7px 8px'}}>Descricao</th>
                    <th className="rv-right" style={{textAlign:'right',color:'#999',fontWeight:600,fontSize:10.5,textTransform:'uppercase',borderBottom:'1px solid #e0e0e0',padding:'7px 8px'}}>Vl. Unit</th>
                    <th className="rv-right" style={{textAlign:'right',color:'#999',fontWeight:600,fontSize:10.5,textTransform:'uppercase',borderBottom:'1px solid #e0e0e0',padding:'7px 8px'}}>Subtotal</th>
                  </tr></thead>
                  <tbody>
                    {itensValidos.length===0&&<tr><td colSpan={4} style={{padding:'10px 8px',color:'#bbb',fontSize:12}}>Adicione produtos no formulario...</td></tr>}
                    {itensValidos.map((it,i)=>(
                      <tr key={i}>
                        <td style={{padding:'8px',borderBottom:'1px solid #f1f1f1'}}>{it.qtd||1}</td>
                        <td style={{padding:'8px',borderBottom:'1px solid #f1f1f1'}}>{it.descricao||'—'}</td>
                        <td className="rv-right" style={{padding:'8px',borderBottom:'1px solid #f1f1f1',textAlign:'right'}}>{fmt(it.valor)}</td>
                        <td className="rv-right" style={{padding:'8px',borderBottom:'1px solid #f1f1f1',textAlign:'right',fontWeight:600}}>{fmt(Number(it.qtd||0)*Number(it.valor||0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{maxWidth:300,marginLeft:'auto'}}>
                <div className="rv-tot" style={{display:'flex',justifyContent:'space-between',padding:'4px 2px',fontSize:13,color:'#555'}}><span>Total dos produtos</span><strong style={{color:'#1a1a1a'}}>{fmt(totalProdutos)}</strong></div>
                {valorTroca>0&&<div className="rv-tot" style={{display:'flex',justifyContent:'space-between',padding:'4px 2px',fontSize:13,color:'#555'}}><span>Troca{troca.descricao?' ('+troca.descricao+')':''}</span><span>− {fmt(valorTroca)}</span></div>}
                <div className="rv-dif" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderRadius:8,marginTop:8,background:dif.bg,border:'1px solid '+dif.bd}}>
                  <span className="lbl" style={{fontSize:13,color:'#555'}}>{dif.label}</span>
                  <span className="val" style={{fontSize:20,fontWeight:700,color:dif.cor}}>{fmt(dif.valor)}</span>
                </div>
              </div>

              {pagamento&&<div className="rv-block" style={{marginTop:12,padding:'12px 14px',background:'#f9f9f7',borderRadius:8,border:'1px solid #eee',fontSize:12.5,color:'#333',lineHeight:1.5}}><span className="bt" style={{display:'block',fontSize:10,textTransform:'uppercase',color:'#aaa',marginBottom:4,letterSpacing:'.05em',fontWeight:700}}>Forma de pagamento</span>{pagamento}</div>}
              {obs&&<div className="rv-block" style={{marginTop:12,padding:'12px 14px',background:'#f9f9f7',borderRadius:8,border:'1px solid #eee',fontSize:12.5,color:'#333',lineHeight:1.5}}><span className="bt" style={{display:'block',fontSize:10,textTransform:'uppercase',color:'#aaa',marginBottom:4,letterSpacing:'.05em',fontWeight:700}}>Observacoes</span>{obs}</div>}
              {garantiaOn&&garantiaTexto&&<div className="rv-block" style={{marginTop:12,padding:'12px 14px',background:'#f9f9f7',borderRadius:8,border:'1px solid #eee',fontSize:12.5,color:'#333',lineHeight:1.5}}><span className="bt" style={{display:'block',fontSize:10,textTransform:'uppercase',color:'#aaa',marginBottom:4,letterSpacing:'.05em',fontWeight:700}}>Garantia</span>{garantiaTexto}</div>}
              {especOn&&especTexto&&<div className="rv-block" style={{marginTop:12,padding:'12px 14px',background:'#f9f9f7',borderRadius:8,border:'1px solid #eee',fontSize:12.5,color:'#333',lineHeight:1.5}}><span className="bt" style={{display:'block',fontSize:10,textTransform:'uppercase',color:'#aaa',marginBottom:4,letterSpacing:'.05em',fontWeight:700}}>Especificacoes</span>{especTexto}</div>}

              <div className="rv-foot" style={{marginTop:22,paddingTop:14,borderTop:'1px dashed #e0e0e0',textAlign:'center',fontSize:11.5,color:'#888'}}>
                Obrigado pela preferencia! · {empresa.nome} · {empresa.telefone}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
