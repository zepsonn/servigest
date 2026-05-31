import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [histModal, setHistModal] = useState(null)
  const [hist, setHist] = useState([])
  const [form, setForm] = useState({nome:'',telefone:'',whatsapp:'',email:'',cpf_cnpj:'',endereco:'',observacoes:''})
  const [user, setUser] = useState(null)

  useEffect(()=>{ 
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    setUser(u)
    loadClientes()
  },[])

  async function loadClientes() {
    const { data } = await supabase.from('clientes').select('*').eq('ativo',true).order('nome')
    setClientes(data||[])
  }

  async function salvar() {
    if (!form.nome) return
    await supabase.from('clientes').insert([form])
    setModal(false)
    setForm({nome:'',telefone:'',whatsapp:'',email:'',cpf_cnpj:'',endereco:'',observacoes:''})
    loadClientes()
  }

  async function verHistorico(cli) {
    const { data } = await supabase.from('agendamentos').select('*, usuarios(nome)').eq('cliente_id', cli.id).order('data', {ascending:false})
    setHist(data||[])
    setHistModal(cli)
  }

  const filtrados = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()))
  const isGestor = user?.role === 'gestor'

  return (
    <Layout title="Clientes">
      <div style={s.toolbar}>
        <input style={s.search} placeholder="Buscar cliente..." value={busca} onChange={e=>setBusca(e.target.value)} />
        {isGestor && <button style={s.btnPrimary} onClick={()=>setModal(true)}>+ Novo cliente</button>}
      </div>
      <div style={s.card}>
        <table style={s.table}>
          <thead><tr>{['Nome','Telefone','Endereço','CPF/CNPJ','Ações'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{filtrados.map(c=>(
            <tr key={c.id}>
              <td style={s.td}><strong>{c.nome}</strong></td>
              <td style={s.td}>{c.telefone}</td>
              <td style={s.td}>{c.endereco}</td>
              <td style={s.td}>{c.cpf_cnpj}</td>
              <td style={s.td}>
                <div style={{display:'flex',gap:6}}>
                  <button style={s.btnSm} onClick={()=>verHistorico(c)}>🕐 Histórico</button>
                  {isGestor && <a href={`/notas?cliente=${c.id}&nome=${encodeURIComponent(c.nome)}&tel=${c.whatsapp||''}&doc=${c.cpf_cnpj||''}&end=${encodeURIComponent(c.endereco||'')}`} style={{...s.btnSm,...s.btnPrimary}}>🧾 NF</a>}
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.mHead}><span>Novo cliente</span><button style={s.xBtn} onClick={()=>setModal(false)}>×</button></div>
            {[['nome','Nome completo'],['telefone','Telefone'],['whatsapp','WhatsApp (só números)'],['email','E-mail'],['cpf_cnpj','CPF / CNPJ'],['endereco','Endereço']].map(([k,l])=>(
              <div key={k} style={s.fg}><label style={s.label}>{l}</label><input style={s.input} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} /></div>
            ))}
            <div style={s.fg}><label style={s.label}>Observações</label><textarea style={{...s.input,minHeight:60}} value={form.observacoes} onChange={e=>setForm({...form,observacoes:e.target.value})} /></div>
            <div style={s.btnRow}><button style={s.btnSecondary} onClick={()=>setModal(false)}>Cancelar</button><button style={s.btnPrimary} onClick={salvar}>Salvar</button></div>
          </div>
        </div>
      )}

      {histModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.mHead}><span>Histórico — {histModal.nome}</span><button style={s.xBtn} onClick={()=>setHistModal(null)}>×</button></div>
            {hist.length === 0 && <p style={{fontSize:13,color:'#888'}}>Nenhum serviço registrado.</p>}
            {hist.map(a=>(
              <div key={a.id} style={s.histItem}>
                <div style={{fontSize:10,color:'#888',marginBottom:2}}>{new Date(a.data+'T12:00').toLocaleDateString('pt-BR')} · {a.hora?.slice(0,5)}</div>
                <div style={{fontSize:13}}>{a.servico} — {a.usuarios?.nome} — <span style={{textTransform:'capitalize'}}>{a.status}</span></div>
              </div>
            ))}
            <div style={s.btnRow}><button style={s.btnPrimary} onClick={()=>setHistModal(null)}>Fechar</button></div>
          </div>
        </div>
      )}
    </Layout>
  )
}

const s = {
  toolbar:{display:'flex',gap:8,marginBottom:16},
  search:{flex:1,padding:'7px 12px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:13,fontFamily:'inherit'},
  card:{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,overflow:'hidden'},
  table:{width:'100%',borderCollapse:'collapse',fontSize:13},
  th:{textAlign:'left',padding:'8px 12px',color:'#888',fontWeight:500,fontSize:11,background:'#fafaf8',borderBottom:'1px solid #f0f0f0'},
  td:{padding:'9px 12px',borderBottom:'1px solid #f8f8f8'},
  btnSm:{padding:'4px 10px',borderRadius:6,border:'1px solid #e0e0e0',fontSize:11,cursor:'pointer',background:'#fff',fontFamily:'inherit'},
  btnPrimary:{padding:'7px 14px',borderRadius:8,background:'#1D9E75',color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontFamily:'inherit',fontWeight:500},
  btnSecondary:{padding:'7px 14px',borderRadius:8,background:'transparent',color:'#666',border:'1px solid #e0e0e0',fontSize:13,cursor:'pointer',fontFamily:'inherit'},
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'},
  modal:{background:'#fff',borderRadius:12,padding:24,width:480,maxWidth:'95vw',maxHeight:'90vh',overflow:'auto'},
  mHead:{fontSize:15,fontWeight:500,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'},
  xBtn:{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'},
  fg:{marginBottom:12},
  label:{display:'block',fontSize:11,color:'#888',fontWeight:500,marginBottom:3},
  input:{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:13,fontFamily:'inherit'},
  btnRow:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16},
  histItem:{borderLeft:'2px solid #1D9E75',padding:'6px 10px',marginBottom:8,background:'#f9f9f7',borderRadius:'0 8px 8px 0'},
}
