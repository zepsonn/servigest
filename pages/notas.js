import { useEffect, useState, useRef } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Notas() {
  const [clientes, setClientes] = useState([])
  const [empresa, setEmpresa] = useState({})
  const [logoDataUrl, setLogoDataUrl] = useState(null)
  const [itens, setItens] = useState([{desc:'',qtd:1,valor:0}])
  const [form, setForm] = useState({cli_nome:'',cli_doc:'',cli_tel:'',cli_end:'',numero:'0001',data_emissao:'',data_vencimento:'',forma_pagamento:'PIX',observacoes:''})
  const [lista, setLista] = useState([])
  const [tab, setTab] = useState('nova')
  const router = useRouter()

  useEffect(()=>{
    const today = new Date().toISOString().split('T')[0]
    setForm(f=>({...f, data_emissao:today, data_vencimento:today}))
    supabase.from('empresa').select('*').single().then(({data})=>{ if(data) setEmpresa(data) })
    supabase.from('clientes').select('id,nome,whatsapp,cpf_cnpj,endereco').eq('ativo',true).order('nome').then(({data})=>setClientes(data||[]))
    supabase.from('notas_fiscais').select('*, clientes(nome)').order('criado_em',{ascending:false}).then(({data})=>setLista(data||[]))
    supabase.from('notas_fiscais').select('numero').order('criado_em',{ascending:false}).limit(1).then(({data})=>{
      if(data && data[0]) { const n = parseInt(data[0].numero)+1; setForm(f=>({...f,numero:String(n).padStart(4,'0')})) }
    })
    // preencher do query string
    const {cliente,nome,tel,doc,end} = router.query
    if(nome) setForm(f=>({...f,cli_nome:decodeURIComponent(nome),cli_tel:tel||'',cli_doc:doc||'',cli_end:decodeURIComponent(end||'')}))
  },[router.query])

  function handleLogo(e) {
    const file = e.target.files[0]; if(!file) return
    const r = new FileReader()
    r.onload = ev => setLogoDataUrl(ev.target.result)
    r.readAsDataURL(file)
  }

  function addItem(){ setItens([...itens,{desc:'',qtd:1,valor:0}]) }
  function removeItem(i){ if(itens.length===1) return; setItens(itens.filter((_,idx)=>idx!==i)) }
  function updateItem(i,k,v){ const copy=[...itens]; copy[i]={...copy[i],[k]:k==='desc'?v:Number(v)}; setItens(copy) }

  const total = itens.reduce((s,it)=>s+(it.qtd*it.valor),0)
  const fmt = n => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const fmtDate = d => d ? new Date(d+'T12:00').toLocaleDateString('pt-BR') : '—'

  async function salvarNF() {
    const { error } = await supabase.from('notas_fiscais').insert([{
      numero: form.numero,
      cliente_id: clientes.find(c=>c.nome===form.cli_nome)?.id || null,
      itens: itens,
      total: total,
      data_emissao: form.data_emissao,
      data_vencimento: form.data_vencimento,
      forma_pagamento: form.forma_pagamento,
      observacoes: form.observacoes,
      status: 'pendente'
    }])
    if (!error) { alert('Nota fiscal salva!'); setTab('lista') }
  }

  function sendWhatsApp() {
    const tel = form.cli_tel.replace(/\D/g,'')
    if (!tel) { alert('Informe o WhatsApp do cliente'); return }
    const msg = `Olá, ${form.cli_nome}! 👋\n\nSegue sua nota fiscal *Nº ${form.numero}* — *${empresa.nome||''}*.\n\n📋 Serviços:\n${itens.map(it=>`• ${it.desc} — ${fmt(it.qtd*it.valor)}`).join('\n')}\n\n💰 *Total: ${fmt(total)}*\nVencimento: ${form.data_vencimento} | ${form.forma_pagamento}\n\n${form.observacoes||''}\n\nQualquer dúvida, estamos à disposição! 😊`
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`,'_blank')
  }

  return (
    <Layout title="Notas Fiscais">
      <div style={{display:'flex',gap:0,marginBottom:20}}>
        {['nova','lista'].map(t=>(
          <button key={t} style={{...s.tab, ...(tab===t?s.tabActive:{})}} onClick={()=>setTab(t)}>
            {t==='nova'?'+ Nova nota fiscal':'📋 Notas emitidas'}
          </button>
        ))}
      </div>

      {tab==='nova' && (
        <div style={s.twoCols}>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Logo */}
            <div style={s.card}>
              <div style={s.sectionTitle}>Logo da empresa</div>
              <label style={s.uploadZone}>
                <input type="file" accept="image/*" style={{display:'none'}} onChange={handleLogo} />
                {logoDataUrl ? <img src={logoDataUrl} style={{maxHeight:50,maxWidth:150,objectFit:'contain'}} /> : <span style={{fontSize:12,color:'#aaa'}}>📷 Clique para enviar a logo</span>}
              </label>
            </div>
            {/* Empresa */}
            <div style={s.card}>
              <div style={s.sectionTitle}>Empresa</div>
              <FG label="Nome" value={empresa.nome||''} onChange={v=>setEmpresa({...empresa,nome:v})} />
              <div style={s.row2}>
                <FG label="CNPJ" value={empresa.cnpj||''} onChange={v=>setEmpresa({...empresa,cnpj:v})} />
                <FG label="Cidade/UF" value={empresa.cidade||''} onChange={v=>setEmpresa({...empresa,cidade:v})} />
              </div>
            </div>
            {/* Cliente */}
            <div style={s.card}>
              <div style={s.sectionTitle}>Cliente</div>
              <div style={s.fg}><label style={s.label}>Selecionar cliente</label>
                <select style={s.input} onChange={e=>{const c=clientes.find(x=>x.id===e.target.value); if(c) setForm({...form,cli_nome:c.nome,cli_tel:c.whatsapp||'',cli_doc:c.cpf_cnpj||'',cli_end:c.endereco||''})}}>
                  <option value="">— ou preencha manualmente —</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <FG label="Nome" value={form.cli_nome} onChange={v=>setForm({...form,cli_nome:v})} />
              <div style={s.row2}>
                <FG label="CPF/CNPJ" value={form.cli_doc} onChange={v=>setForm({...form,cli_doc:v})} />
                <FG label="WhatsApp" value={form.cli_tel} onChange={v=>setForm({...form,cli_tel:v})} />
              </div>
              <FG label="Endereço" value={form.cli_end} onChange={v=>setForm({...form,cli_end:v})} />
            </div>
            {/* Itens */}
            <div style={s.card}>
              <div style={s.sectionTitle}>Serviços / itens</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 50px 80px 20px',gap:5,marginBottom:4,fontSize:10,color:'#aaa',fontWeight:500}}><span>Descrição</span><span>Qtd</span><span>R$ unit.</span><span/></div>
              {itens.map((it,i)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 50px 80px 20px',gap:5,marginBottom:5}}>
                  <input style={s.inputSm} value={it.desc} placeholder="Descrição" onChange={e=>updateItem(i,'desc',e.target.value)} />
                  <input style={s.inputSm} type="number" value={it.qtd} min={1} onChange={e=>updateItem(i,'qtd',e.target.value)} />
                  <input style={s.inputSm} type="number" value={it.valor} min={0} step={0.01} onChange={e=>updateItem(i,'valor',e.target.value)} />
                  <button style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:'#aaa'}} onClick={()=>removeItem(i)}>×</button>
                </div>
              ))}
              <button style={{fontSize:12,color:'#1D9E75',background:'none',border:'none',cursor:'pointer',padding:'3px 0',fontFamily:'inherit'}} onClick={addItem}>+ Adicionar item</button>
            </div>
            {/* NF info */}
            <div style={s.card}>
              <div style={s.sectionTitle}>Nota fiscal</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <FG label="Número" value={form.numero} onChange={v=>setForm({...form,numero:v})} />
                <FG label="Emissão" type="date" value={form.data_emissao} onChange={v=>setForm({...form,data_emissao:v})} />
                <FG label="Vencimento" type="date" value={form.data_vencimento} onChange={v=>setForm({...form,data_vencimento:v})} />
              </div>
              <div style={s.fg}><label style={s.label}>Pagamento</label>
                <select style={s.input} value={form.forma_pagamento} onChange={e=>setForm({...form,forma_pagamento:e.target.value})}>
                  {['PIX','Boleto','Cartão de crédito','Dinheiro','Transferência'].map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <FG label="Observações" value={form.observacoes} onChange={v=>setForm({...form,observacoes:v})} textarea />
            </div>
          </div>

          {/* PREVIEW */}
          <div style={{display:'flex',flexDirection:'column',gap:16,position:'sticky',top:0}}>
            <div style={s.card}>
              <div style={s.sectionTitle}>Prévia da nota fiscal</div>
              <div style={s.nfDoc}>
                <div style={s.nfTop}>
                  <div>
                    {logoDataUrl ? <img src={logoDataUrl} style={{maxHeight:40,maxWidth:120,objectFit:'contain'}} /> : <div style={{width:70,height:28,background:'#f0f0f0',borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'#bbb'}}>SUA LOGO</div>}
                    <div style={{fontWeight:700,fontSize:12,marginTop:4}}>{empresa.nome}</div>
                    <div style={{fontSize:9,color:'#888'}}>CNPJ: {empresa.cnpj} · {empresa.cidade}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{background:'#1D9E75',color:'#fff',padding:'2px 7px',borderRadius:3,fontSize:9,fontWeight:700,display:'inline-block'}}>NOTA FISCAL</div>
                    <div style={{fontSize:16,fontWeight:700,color:'#1D9E75'}}>Nº {form.numero}</div>
                    <div style={{fontSize:9,color:'#888'}}>Emissão: {fmtDate(form.data_emissao)}</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                  <div><div style={{fontSize:9,textTransform:'uppercase',color:'#bbb',marginBottom:2}}>Prestador</div><div style={{fontWeight:700,fontSize:11}}>{empresa.nome}</div><div style={{fontSize:9,color:'#888'}}>{empresa.cnpj}<br/>{empresa.cidade}</div></div>
                  <div><div style={{fontSize:9,textTransform:'uppercase',color:'#bbb',marginBottom:2}}>Tomador</div><div style={{fontWeight:700,fontSize:11}}>{form.cli_nome||'—'}</div><div style={{fontSize:9,color:'#888'}}>{form.cli_doc}<br/>{form.cli_end}</div></div>
                </div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,marginBottom:6}}>
                  <thead><tr>{['Descrição','Qtd','Unit.','Total'].map(h=><th key={h} style={{textAlign:h==='Descrição'?'left':'right',padding:'3px 5px',background:'#f7f7f7',fontSize:8,fontWeight:700,color:'#888',borderBottom:'1px solid #eee'}}>{h}</th>)}</tr></thead>
                  <tbody>{itens.map((it,i)=><tr key={i}><td style={{padding:'4px 5px',borderBottom:'1px solid #f5f5f5'}}>{it.desc||'—'}</td><td style={{padding:'4px 5px',textAlign:'right',borderBottom:'1px solid #f5f5f5'}}>{it.qtd}</td><td style={{padding:'4px 5px',textAlign:'right',borderBottom:'1px solid #f5f5f5'}}>{fmt(it.valor)}</td><td style={{padding:'4px 5px',textAlign:'right',borderBottom:'1px solid #f5f5f5'}}>{fmt(it.qtd*it.valor)}</td></tr>)}</tbody>
                </table>
                <div style={{display:'flex',justifyContent:'flex-end',gap:12,alignItems:'center',borderTop:'1.5px solid #1D9E75',paddingTop:5,marginBottom:6}}>
                  <span style={{fontSize:10,color:'#888'}}>Total</span><span style={{fontSize:14,fontWeight:700,color:'#1D9E75'}}>{fmt(total)}</span>
                </div>
                <div style={{fontSize:9,color:'#bbb',borderTop:'1px solid #f0f0f0',paddingTop:4,display:'flex',justifyContent:'space-between'}}>
                  <span>Venc: {fmtDate(form.data_vencimento)} · {form.forma_pagamento}</span><span>{form.observacoes}</span>
                </div>
              </div>
            </div>
            <div style={s.card}>
              <div style={s.sectionTitle}>Ações</div>
              <button style={{...s.btnFull,marginBottom:8}} onClick={salvarNF}>💾 Salvar nota fiscal</button>
              <button style={{...s.btnFull,background:'#25D366',border:'1px solid #25D366',color:'#fff'}} onClick={sendWhatsApp}>
                📲 Enviar por WhatsApp
              </button>
              <div style={{fontSize:11,color:'#aaa',textAlign:'center',marginTop:6}}>Abre o WhatsApp com mensagem pronta</div>
            </div>
          </div>
        </div>
      )}

      {tab==='lista' && (
        <div style={s.card}>
          <table style={s.table}>
            <thead><tr>{['Nº','Cliente','Total','Pagamento','Emissão','Status'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>{lista.map(n=>(
              <tr key={n.id}>
                <td style={s.td}>#{n.numero}</td>
                <td style={s.td}>{n.clientes?.nome}</td>
                <td style={s.td}>{fmt(Number(n.total))}</td>
                <td style={s.td}>{n.forma_pagamento}</td>
                <td style={s.td}>{fmtDate(n.data_emissao)}</td>
                <td style={s.td}><span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:n.status==='paga'?'#EAF3DE':'#FAEEDA',color:n.status==='paga'?'#3B6D11':'#854F0B'}}>{n.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}

function FG({label,value,onChange,type='text',textarea}){
  const s2={width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:13,fontFamily:'inherit',minHeight:textarea?64:undefined,resize:textarea?'vertical':undefined}
  return <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,color:'#888',fontWeight:500,marginBottom:3}}>{label}</label>{textarea?<textarea style={s2} value={value} onChange={e=>onChange(e.target.value)}/>:<input style={s2} type={type} value={value} onChange={e=>onChange(e.target.value)}/>}</div>
}

const s = {
  twoCols:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'},
  tab:{padding:'8px 18px',borderRadius:'8px 8px 0 0',border:'1px solid #e0e0e0',borderBottom:'none',background:'#fafaf8',cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:500,color:'#888'},
  tabActive:{background:'#fff',color:'#1D9E75',borderBottom:'1px solid #fff',marginBottom:-1,zIndex:1},
  card:{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:16,overflow:'hidden'},
  sectionTitle:{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#aaa',marginBottom:10,paddingBottom:6,borderBottom:'1px solid #f0f0f0'},
  uploadZone:{display:'flex',alignItems:'center',justifyContent:'center',border:'1.5px dashed #e0e0e0',borderRadius:8,padding:12,cursor:'pointer',minHeight:60},
  fg:{marginBottom:12},
  label:{display:'block',fontSize:11,color:'#888',fontWeight:500,marginBottom:3},
  input:{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:13,fontFamily:'inherit'},
  inputSm:{width:'100%',padding:'5px 8px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:12,fontFamily:'inherit'},
  row2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10},
  nfDoc:{background:'#fff',border:'1px solid #e0e0e0',borderRadius:8,padding:14,fontSize:11,color:'#1a1a1a'},
  nfTop:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10,paddingBottom:10,borderBottom:'1px solid #eee'},
  btnFull:{width:'100%',padding:'9px',borderRadius:8,border:'1px solid #e0e0e0',background:'transparent',fontSize:13,cursor:'pointer',fontFamily:'inherit',fontWeight:500},
  table:{width:'100%',borderCollapse:'collapse',fontSize:13},
  th:{textAlign:'left',padding:'8px 12px',color:'#888',fontWeight:500,fontSize:11,background:'#fafaf8',borderBottom:'1px solid #f0f0f0'},
  td:{padding:'9px 12px',borderBottom:'1px solid #f8f8f8'},
}
