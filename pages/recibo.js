import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Recibo() {
  const [os, setOs] = useState(null)
  const [empresa, setEmpresa] = useState({nome:'Top Eletro - Inova', cnpj:'82.668.070/0001-87', cidade:'Rua Professor João Barcelos, 2273 - Loja 02, Bairro Hauer - Curitiba, PR', telefone:'(41) 99846-1851 / 3206-7414', email:'tecnicainova@outlook.com'})
  const router = useRouter()

  useEffect(()=>{
    supabase.from('empresa').select('*').single().then(({data})=>{ if(data) setEmpresa(prev=>({...prev,...data})) })
    if(router.query.os) {
      supabase.from('ordens_servico').select('*, usuarios(nome)').eq('id', router.query.os).single().then(({data})=>{ if(data) setOs(data) })
    }
  },[router.query])

  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const fmtDate = d => d ? new Date(d+'T12:00').toLocaleDateString('pt-BR') : '—'

  function sendWhatsApp() {
    if(!os) return
    const tel = (os.cliente_telefone||'').replace(/\D/g,'')
    if(!tel){ alert('Cliente sem telefone cadastrado'); return }
    const msg = 'Olá, ' + os.cliente_nome + '! 👋\n\nSegue seu recibo referente ao serviço realizado por *' + empresa.nome + '*.\n\n📋 *OS Nº ' + os.numero + '*\n🔧 Produto: ' + (os.produto||'—') + '\n⚙️ Serviço: ' + os.servico + '\n📅 Data: ' + fmtDate(os.data_entrada) + '\n\n💰 *Valor: ' + fmt(os.valor) + '*\n\n' + (os.observacoes||'') + '\n\nAgradecemos a preferência! 😊'
    window.open('https://wa.me/55' + tel + '?text=' + encodeURIComponent(msg),'_blank')
  }

  function imprimir() { window.print() }

  return (
    <Layout title="Recibo">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>
      <div style={{maxWidth:700,margin:'0 auto'}}>
        {!os && (
          <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:24}}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:16}}>Selecionar Ordem de Serviço para gerar o recibo</div>
            <OSSelector onSelect={setOs} />
          </div>
        )}
        {os && (
          <>
            <div className="no-print" style={{display:'flex',gap:8,marginBottom:16,justifyContent:'flex-end'}}>
              <button style={s.btnSm} onClick={()=>setOs(null)}>← Trocar OS</button>
              <button style={s.btnSm} onClick={imprimir}>🖨️ Imprimir / PDF</button>
              <button style={{...s.btnSm,background:'#25D366',color:'#fff',border:'1px solid #25D366'}} onClick={sendWhatsApp}>📲 Enviar WhatsApp</button>
            </div>
            <div style={s.recibo}>
              <div style={s.header}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={s.logoBox}>TI</div>
                  <div>
                    <div style={{fontSize:18,fontWeight:700}}>{empresa.nome}</div>
                    {empresa.cnpj && <div style={{fontSize:11,color:'#888'}}>CNPJ: {empresa.cnpj}</div>}
                    <div style={{fontSize:11,color:'#888'}}>{empresa.cidade}</div>
                    <div style={{fontSize:11,color:'#888'}}>{empresa.telefone}{empresa.email?' · '+empresa.email:''}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{background:'#1D9E75',color:'#fff',padding:'3px 10px',borderRadius:4,fontSize:10,fontWeight:700,display:'inline-block',marginBottom:4}}>RECIBO</div>
                  <div style={{fontSize:20,fontWeight:700,color:'#1D9E75'}}>OS Nº {os.numero}</div>
                  <div style={{fontSize:11,color:'#888'}}>Emissão: {fmtDate(os.data_entrada)}</div>
                </div>
              </div>
              <div style={s.section}>
                <div style={s.sectionTitle}>Dados do Cliente</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:13}}>
                  <div><span style={s.fieldLabel}>Nome:</span> {os.cliente_nome||'—'}</div>
                  <div><span style={s.fieldLabel}>Telefone:</span> {os.cliente_telefone||'—'}</div>
                  <div style={{gridColumn:'1/-1'}}><span style={s.fieldLabel}>Endereço:</span> {os.cliente_endereco||'—'}</div>
                </div>
              </div>
              <div style={s.section}>
                <div style={s.sectionTitle}>Ordem de Serviço</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:13,marginBottom:10}}>
                  <div><span style={s.fieldLabel}>Produto/Equipamento:</span> {os.produto||'—'}</div>
                  <div><span style={s.fieldLabel}>Técnico:</span> {os.usuarios?.nome||'—'}</div>
                  <div><span style={s.fieldLabel}>Data de entrada:</span> {fmtDate(os.data_entrada)}</div>
                  <div><span style={s.fieldLabel}>Data de conclusão:</span> {fmtDate(os.data_conclusao)}</div>
                </div>
                <div style={{marginBottom:8,fontSize:13}}><span style={s.fieldLabel}>Serviço realizado:</span> {os.servico}</div>
                {os.descricao && <div style={{fontSize:13,background:'#f9f9f7',padding:'8px 12px',borderRadius:6,borderLeft:'3px solid #1D9E75'}}>{os.descricao}</div>}
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:16,padding:'12px 0',borderTop:'2px solid #1D9E75',marginTop:8}}>
                <span style={{fontSize:13,color:'#666'}}>Total do serviço</span>
                <span style={{fontSize:22,fontWeight:700,color:'#1D9E75'}}>{fmt(os.valor)}</span>
              </div>
              {os.observacoes && <div style={{fontSize:12,color:'#888',marginTop:8,padding:'8px 12px',background:'#f9f9f7',borderRadius:6}}><strong>Obs:</strong> {os.observacoes}</div>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginTop:32,paddingTop:16,borderTop:'1px dashed #e0e0e0'}}>
                <div style={{textAlign:'center'}}><div style={{borderTop:'1px solid #333',paddingTop:6,fontSize:11,color:'#888'}}>{empresa.nome}</div></div>
                <div style={{textAlign:'center'}}><div style={{borderTop:'1px solid #333',paddingTop:6,fontSize:11,color:'#888'}}>Cliente: {os.cliente_nome||'_____________'}</div></div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

function OSSelector({onSelect}) {
  const [lista, setLista] = useState([])
  const [busca, setBusca] = useState('')
  useEffect(()=>{ supabase.from('ordens_servico').select('*').order('criado_em',{ascending:false}).then(({data})=>setLista(data||[])) },[])
  const filtradas = lista.filter(os => (os.cliente_nome||'').toLowerCase().includes(busca.toLowerCase()) || (os.cliente_telefone||'').includes(busca) || String(os.numero).includes(busca))
  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  return (
    <div>
      <input style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:13,fontFamily:'inherit',marginBottom:12}} placeholder="🔍 Buscar por nome, telefone ou nº OS..." value={busca} onChange={e=>setBusca(e.target.value)} />
      <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:360,overflow:'auto'}}>
        {filtradas.map(os=>(
          <div key={os.id} onClick={()=>onSelect(os)} style={{padding:'10px 14px',border:'1px solid #e8e8e8',borderRadius:8,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13,background:'#fafaf8'}}>
            <div><div style={{fontWeight:500}}>#{os.numero} · {os.cliente_nome||'Cliente não informado'}</div><div style={{fontSize:11,color:'#888',marginTop:2}}>{os.servico} · {os.cliente_telefone||'—'}</div></div>
            <div style={{fontWeight:600,color:'#1D9E75'}}>{fmt(os.valor)}</div>
          </div>
        ))}
        {filtradas.length===0 && <div style={{fontSize:13,color:'#aaa',textAlign:'center',padding:16}}>Nenhuma OS encontrada.</div>}
      </div>
    </div>
  )
}

const s = {
  recibo:{background:'#fff',border:'1px solid #e8e8e8',borderRadius:12,padding:28,fontFamily:'DM Sans, sans-serif'},
  header:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,paddingBottom:16,borderBottom:'2px solid #f0f0f0'},
  logoBox:{width:52,height:52,borderRadius:8,background:'#1D9E75',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:16,flexShrink:0},
  section:{marginBottom:16,padding:14,background:'#fafaf8',borderRadius:8,border:'1px solid #f0f0f0'},
  sectionTitle:{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'#aaa',marginBottom:10},
  fieldLabel:{fontWeight:600,color:'#555'},
  btnSm:{padding:'6px 14px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:12,cursor:'pointer',background:'#fff',fontFamily:'inherit',fontWeight:500},
}
