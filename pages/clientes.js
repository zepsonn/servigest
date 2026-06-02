import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [histModal, setHistModal] = useState(null)
  const [hist, setHist] = useState({agendamentos:[], os:[]})
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({nome:'',telefone:'',whatsapp:'',email:'',cpf_cnpj:'',endereco:'',observacoes:''})
  const [editForm, setEditForm] = useState({})

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

  async function salvarEdicao() {
    await supabase.from('clientes').update(editForm).eq('id', editModal.id)
    setEditModal(null)
    loadClientes()
  }

  async function apagar(cli) {
    if (!confirm('Apagar o cliente "' + cli.nome + '"? Esta ação não pode ser desfeita.')) return
    await supabase.from('clientes').update({ativo:false}).eq('id', cli.id)
    loadClientes()
  }

  async function verHistorico(cli) {
    const [{ data: ag }, { data: os }] = await Promise.all([
      supabase.from('agendamentos').select('*, usuarios(nome)').eq('cliente_id', cli.id).order('data',{ascending:false}),
      supabase.from('ordens_servico').select('*, usuarios(nome)').eq('cliente_id', cli.id).order('criado_em',{ascending:false})
    ])
    setHist({ agendamentos: ag||[], os: os||[] })
    setHistModal(cli)
  }

  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const fmtDate = d => d ? new Date(d+'T12:00').toLocaleDateString('pt-BR') : '—'
  const filtrados = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.telefone||'').includes(busca))
  const isGestor = user?.role === 'gestor'
  const statusBg = {aberta:'#E6F1FB',em_andamento:'#FAEEDA',concluida:'#EAF3DE',cancelada:'#FCEBEB'}
  const statusColor = {aberta:'#185FA5',em_andamento:'#854F0B',concluida:'#3B6D11',cancelada:'#A32D2D'}

  const campos = [['nome','Nome completo'],['telefone','Telefone'],['whatsapp','WhatsApp'],['email','E-mail'],['cpf_cnpj','CPF / CNPJ'],['endereco','Endereço']]

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
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  <button style={s.btnSm} onClick={()=>verHistorico(c)}>📋 Histórico</button>
                  {isGestor && <button style={s.btnSm} onClick={()=>{setEditForm({...c});setEditModal(c)}}>✏️ Editar</button>}
                  {isGestor && <button style={{...s.btnSm,color:'#A32D2D',borderColor:'#FCEBEB'}} onClick={()=>apagar(c)}>🗑️ Apagar</button>}
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {/* MODAL NOVO */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.mHead}><span>Novo cliente</span><button style={s.xBtn} onClick={()=>setModal(false)}>×</button></div>
            {campos.map(([k,l])=>(
              <div key={k} style={s.fg}><label style={s.label}>{l}</label><input style={s.input} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} /></div>
            ))}
            <div style={s.fg}><label style={s.label}>Observações</label><textarea style={{...s.input,minHeight:60}} value={form.observacoes} onChange={e=>setForm({...form,observacoes:e.target.value})} /></div>
            <div style={s.btnRow}><button style={s.btnSecondary} onClick={()=>setModal(false)}>Cancelar</button><button style={s.btnPrimary} onClick={salvar}>Salvar</button></div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {editModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.mHead}><span>Editar — {editModal.nome}</span><button style={s.xBtn} onClick={()=>setEditModal(null)}>×</button></div>
            {campos.map(([k,l])=>(
              <div key={k} style={s.fg}><label style={s.label}>{l}</label><input style={s.input} value={editForm[k]||''} onChange={e=>setEditForm({...editForm,[k]:e.target.value})} /></div>
            ))}
            <div style={s.fg}><label style={s.label}>Observações</label><textarea style={{...s.input,minHeight:60}} value={editForm.observacoes||''} onChange={e=>setEditForm({...editForm,observacoes:e.target.value})} /></div>
            <div style={s.btnRow}><button style={s.btnSecondary} onClick={()=>setEditModal(null)}>Cancelar</button><button style={s.btnPrimary} onClick={salvarEdicao}>Salvar alterações</button></div>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO */}
      {histModal && (
        <div style={s.overlay}>
          <div style={{...s.modal,width:640,maxHeight:'88vh',overflow:'auto'}}>
            <div style={s.mHead}><span>Histórico — {histModal.nome}</span><button style={s.xBtn} onClick={()=>setHistModal(null)}>×</button></div>
            <div style={s.infoBox}>
              {[['Telefone',histModal.telefone],['Endereço',histModal.endereco],['Email',histModal.email],['CPF/CNPJ',histModal.cpf_cnpj],['Obs',histModal.observacoes]].filter(([,v])=>v).map(([l,v])=>(
                <div key={l} style={{marginBottom:4,fontSize:13}}><span style={s.infoLabel}>{l}:</span> {v}</div>
              ))}
            </div>
            <div style={s.secTitle}>Ordens de Serviço ({hist.os.length})</div>
            {hist.os.length===0 && <div style={s.empty}>Nenhuma OS.</div>}
            {hist.os.map(o=>(
              <div key={o.id} style={s.histCard}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <span style={{fontWeight:700}}>OS #{o.numero}{o.produto?' · '+o.produto:''}</span>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:statusBg[o.status]||'#f0f0f0',color:statusColor[o.status]||'#666'}}>{(o.status||'').replace('_',' ')}</span>
                    <span style={{fontWeight:600,color:'#1D9E75',fontSize:13}}>{fmt(o.valor)}</span>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:12,color:'#555',marginBottom:4}}>
                  <div><span style={s.infoLabel}>Entrada:</span> {fmtDate(o.data_entrada)}</div>
                  <div><span style={s.infoLabel}>Conclusão:</span> {fmtDate(o.data_conclusao)}</div>
                  <div><span style={s.infoLabel}>Técnico:</span> {o.usuarios?.nome||'—'}</div>
                  {o.servico && <div><span style={s.infoLabel}>Serviço:</span> {o.servico}</div>}
                </div>
                {o.descricao && <div style={{fontSize:12,color:'#666',marginTop:4}}><span style={s.infoLabel}>Diagnóstico:</span> {o.descricao}</div>}
                {o.observacoes && <div style={{fontSize:12,color:'#666',marginTop:4}}><span style={s.infoLabel}>Obs:</span> {o.observacoes}</div>}
              </div>
            ))}
            <div style={{...s.secTitle,marginTop:16}}>Agendamentos ({hist.agendamentos.length})</div>
            {hist.agendamentos.length===0 && <div style={s.empty}>Nenhum agendamento.</div>}
            {hist.agendamentos.map(a=>(
              <div key={a.id} style={{...s.histCard,borderLeftColor:'#B5D4F4'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <span style={{fontWeight:500,fontSize:13}}>{a.servico}</span>
                  <span style={{padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:'#E6F1FB',color:'#185FA5'}}>{a.status}</span>
                </div>
                <div style={{fontSize:12,color:'#555'}}><span style={s.infoLabel}>Data:</span> {fmtDate(a.data)}{a.hora?' · '+a.hora.slice(0,5):''} · <span style={s.infoLabel}>Func:</span> {a.usuarios?.nome||'—'}</div>
                {a.observacoes && <div style={{fontSize:12,color:'#666',marginTop:4}}><span style={s.infoLabel}>Obs:</span> {a.observacoes}</div>}
              </div>
            ))}
            <div style={s.btnRow}>
              <button style={s.btnSecondary} onClick={()=>setHistModal(null)}>Fechar</button>
              {isGestor && <button style={s.btnPrimary} onClick={()=>{setHistModal(null);window.location.href='/os'}}>+ Nova OS</button>}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

const s = {
  toolbar:{display:'flex',gap:8,marginBottom:16},
  search:{flex:1,padding:'7px 12px',borderRadius:8,border:'1px solid #e0e0e0',background:'#fff',fontSize:13,fontFamily:'inherit'},
  card:{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,overflow:'hidden'},
  table:{width:'100%',borderCollapse:'collapse',fontSize:13},
  th:{textAlign:'left',padding:'8px 12px',color:'#888',fontWeight:500,fontSize:11,background:'#fafaf8',borderBottom:'1px solid #f0f0f0'},
  td:{padding:'9px 12px',borderBottom:'1px solid #f8f8f8'},
  btnSm:{padding:'4px 10px',borderRadius:6,border:'1px solid #e0e0e0',fontSize:11,cursor:'pointer',background:'#fff',fontFamily:'inherit'},
  btnPrimary:{padding:'7px 14px',borderRadius:8,background:'#1D9E75',color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontFamily:'inherit',fontWeight:500},
  btnSecondary:{padding:'7px 14px',borderRadius:8,background:'transparent',color:'#666',border:'1px solid #e0e0e0',fontSize:13,cursor:'pointer',fontFamily:'inherit'},
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'},
  modal:{background:'#fff',borderRadius:12,padding:24,width:500,maxWidth:'96vw'},
  mHead:{fontSize:15,fontWeight:500,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'},
  xBtn:{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'},
  fg:{marginBottom:12},
  label:{display:'block',fontSize:11,color:'#888',fontWeight:500,marginBottom:3},
  input:{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:13,fontFamily:'inherit'},
  btnRow:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16},
  infoBox:{background:'#f9f9f7',borderRadius:8,padding:'10px 14px',marginBottom:16},
  infoLabel:{fontWeight:600,color:'#555'},
  secTitle:{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#aaa',marginBottom:8,paddingBottom:6,borderBottom:'1px solid #f0f0f0'},
  empty:{fontSize:13,color:'#aaa',padding:'8px 0',marginBottom:8},
  histCard:{borderLeft:'3px solid #1D9E75',padding:'10px 14px',marginBottom:10,background:'#f9f9f7',borderRadius:'0 8px 8px 0'},
}
