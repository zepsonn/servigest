import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import Link from 'next/link'

function useIsMobile(){ const [m,setM]=useState(false); useEffect(()=>{const c=()=>setM(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);return m }
const badgeColors={em_andamento:['#FAEEDA','#854F0B'],concluido:['#EAF3DE','#3B6D11']}
function Badge({s}){const[bg,c]=badgeColors[s]||['#F1EFE8','#5F5E5A'];return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{(s||'').replace('_',' ')}</span>}

function Field({label,value,onChange,t,type}){
  return <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}}>{label}</label><input type={type||'text'} style={{width:'100%',padding:'9px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:14,fontFamily:'inherit',background:t.bgInput,color:t.text}} value={value||''} onChange={e=>onChange(e.target.value)}/></div>
}

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [user, setUser] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({})
  const { t } = useTheme()
  const isMobile = useIsMobile()

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    setUser(u); loadAgendamentos(u)
    supabase.from('usuarios').select('id,nome').eq('ativo',true).order('nome').then(({data})=>setTecnicos(data||[]))
  },[])

  async function loadAgendamentos(u) {
    let q = supabase.from('agendamentos').select('*, clientes(nome,telefone,endereco), usuarios(nome)').order('cliente_nome')
    if(u.role!=='gestor') q=q.eq('funcionario_id',u.id)
    const{data}=await q; setAgendamentos(data||[])
  }

  function nomeCli(a){ return a.cliente_nome||a.clientes?.nome||'—' }
  function telCli(a){ return a.cliente_telefone||a.clientes?.telefone||'' }
  function endCli(a){ return a.cliente_endereco||a.clientes?.endereco||'' }

  async function concluir(id){ await supabase.from('agendamentos').update({status:'concluido'}).eq('id',id); loadAgendamentos(user) }
  async function apagar(ag){
    if(!confirm('Apagar agendamento de "'+nomeCli(ag)+'"?')) return
    await supabase.from('agendamentos').delete().eq('id',ag.id); loadAgendamentos(user)
  }
  async function salvarEdicao(){
    await supabase.from('agendamentos').update({
      cliente_nome:editForm.cliente_nome,cliente_telefone:editForm.cliente_telefone,
      cliente_endereco:editForm.cliente_endereco,servico:editForm.servico,
      data:editForm.data,hora:editForm.hora,status:editForm.status,
      valor:Number(editForm.valor)||0,funcionario_id:editForm.funcionario_id||null,
      observacoes:editForm.observacoes,
    }).eq('id',editModal.id)
    setEditModal(null); loadAgendamentos(user)
  }

  function compartilharWhatsApp(ag){
    const fmtDate=d=>d?new Date(d+'T12:00').toLocaleDateString('pt-BR'):'-'
    const msg=['Top Eletro - Inova','================================','NOVO SERVICO DISPONIVEL','================================','',
      'Cliente: '+nomeCli(ag),'Telefone: '+(telCli(ag)||'-'),'Endereco: '+(endCli(ag)||'-'),'',
      'Servico: '+(ag.servico||'-'),'Data: '+fmtDate(ag.data),'Hora: '+(ag.hora?.slice(0,5)||'-'),'',
      ag.observacoes?'Obs: '+ag.observacoes:'','','================================',
      'Quem tiver disponibilidade,','responda esta mensagem confirmando!','================================','',
      'Top Eletro - Inova','Tel: (41) 99846-1851 / 3206-7414',
    ].filter(l=>l!==null).join('\n')
    window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank')
  }

  const fmt=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const isGestor=user?.role==='gestor'
  const inp={width:'100%',padding:'9px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:14,fontFamily:'inherit',background:t.bgInput,color:t.text}
  const lbl={display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}

  const modalContent = editModal && (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:isMobile?'flex-end':'center',justifyContent:'center'}}>
      <div style={{background:t.bgCard,borderRadius:isMobile?'16px 16px 0 0':12,padding:20,width:isMobile?'100%':500,maxWidth:'100vw',maxHeight:isMobile?'90vh':'92vh',overflow:'auto',border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}><span>Editar agendamento</span><button style={{background:'none',border:'none',fontSize:24,cursor:'pointer',color:t.textSoft}} onClick={()=>setEditModal(null)}>×</button></div>
        <Field label="Nome" value={editForm.cliente_nome} onChange={v=>setEditForm({...editForm,cliente_nome:v})} t={t}/>
        <Field label="Telefone" value={editForm.cliente_telefone} onChange={v=>setEditForm({...editForm,cliente_telefone:v})} t={t}/>
        <Field label="Endereço" value={editForm.cliente_endereco} onChange={v=>setEditForm({...editForm,cliente_endereco:v})} t={t}/>
        <Field label="Serviço" value={editForm.servico} onChange={v=>setEditForm({...editForm,servico:v})} t={t}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="Data" value={editForm.data} onChange={v=>setEditForm({...editForm,data:v})} t={t} type="date"/>
          <Field label="Hora" value={editForm.hora} onChange={v=>setEditForm({...editForm,hora:v})} t={t} type="time"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="Valor (R$)" value={editForm.valor} onChange={v=>setEditForm({...editForm,valor:v})} t={t} type="number"/>
          <div style={{marginBottom:12}}><label style={lbl}>Status</label>
            <select style={inp} value={editForm.status||'em_andamento'} onChange={e=>setEditForm({...editForm,status:e.target.value})}>
              <option value="em_andamento">Em andamento</option><option value="concluido">Concluído</option>
            </select>
          </div>
        </div>
        <div style={{marginBottom:12}}><label style={lbl}>Técnico</label>
          <select style={inp} value={editForm.funcionario_id||''} onChange={e=>setEditForm({...editForm,funcionario_id:e.target.value})}>
            <option value="">Selecione...</option>{tecnicos.map(tc=><option key={tc.id} value={tc.id}>{tc.nome}</option>)}
          </select>
        </div>
        <div style={{marginBottom:12}}><label style={lbl}>Observações</label><textarea style={{...inp,minHeight:60,resize:'vertical'}} value={editForm.observacoes||''} onChange={e=>setEditForm({...editForm,observacoes:e.target.value})}/></div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
          <button style={{padding:'10px 16px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:14,cursor:'pointer',fontFamily:'inherit'}} onClick={()=>setEditModal(null)}>Cancelar</button>
          <button style={{padding:'10px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:14,cursor:'pointer',fontFamily:'inherit',fontWeight:500}} onClick={salvarEdicao}>Salvar</button>
        </div>
      </div>
    </div>
  )

  return (
    <Layout title="Agendamentos">
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        {isGestor&&<Link href="/agendamentos/novo" style={{padding:'8px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500}}>+ Novo agendamento</Link>}
      </div>

      {isMobile ? (
        // MOBILE: cards
        <div>
          {agendamentos.map(a=>(
            <div key={a.id} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:'14px',marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                <div>
                  <div style={{fontWeight:600,color:t.text,fontSize:15}}>{nomeCli(a)}</div>
                  <div style={{fontSize:12,color:t.textSoft,marginTop:2}}>{telCli(a)}</div>
                </div>
                <Badge s={a.status}/>
              </div>
              <div style={{fontSize:13,color:t.text,marginBottom:2}}>{a.servico}</div>
              <div style={{fontSize:12,color:t.textSoft,marginBottom:6}}>
                {new Date(a.data+'T12:00').toLocaleDateString('pt-BR')} {a.hora?.slice(0,5)}
                {a.usuarios?.nome&&' · '+a.usuarios.nome}
              </div>
              {Number(a.valor)>0&&<div style={{fontSize:13,fontWeight:600,color:t.accent,marginBottom:8}}>{fmt(a.valor)}</div>}
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <button style={{flex:1,padding:'8px',borderRadius:8,background:'#25D366',color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:500}} onClick={()=>compartilharWhatsApp(a)}>Compartilhar</button>
                {a.status!=='concluido'&&<button style={{flex:1,padding:'8px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:500}} onClick={()=>concluir(a.id)}>✓ Concluir</button>}
                {isGestor&&<button style={{padding:'8px 12px',borderRadius:8,border:'1px solid '+t.border,fontSize:12,cursor:'pointer',background:t.bgCard,color:t.text}} onClick={()=>{setEditForm({...a,cliente_nome:nomeCli(a),cliente_telefone:telCli(a),cliente_endereco:endCli(a),funcionario_id:a.funcionario_id||''});setEditModal(a)}}>✏️</button>}
                {isGestor&&<button style={{padding:'8px 12px',borderRadius:8,border:'1px solid #FCEBEB',fontSize:12,cursor:'pointer',background:t.bgCard,color:'#A32D2D'}} onClick={()=>apagar(a)}>🗑️</button>}
              </div>
            </div>
          ))}
          {agendamentos.length===0&&<div style={{padding:32,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhum agendamento.</div>}
        </div>
      ):(
        // DESKTOP: tabela
        <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr>{['Cliente','Serviço','Data','Hora','Valor','Funcionário','Status','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 12px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft}}>{h}</th>)}</tr></thead>
            <tbody>{agendamentos.map(a=>(
              <tr key={a.id}>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}><div style={{fontWeight:500}}>{nomeCli(a)}</div><div style={{fontSize:11,color:t.textSoft}}>{telCli(a)}</div></td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{a.servico}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{new Date(a.data+'T12:00').toLocaleDateString('pt-BR')}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{a.hora?.slice(0,5)}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{fmt(a.valor)}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{a.usuarios?.nome||<span style={{color:t.textSoft,fontStyle:'italic'}}>—</span>}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft}}><Badge s={a.status}/></td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft}}><div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  <button style={{padding:'4px 10px',borderRadius:6,border:'1px solid #25D366',fontSize:11,cursor:'pointer',background:'#25D366',color:'#fff',fontWeight:500}} onClick={()=>compartilharWhatsApp(a)}>Compartilhar</button>
                  {a.status!=='concluido'&&<button style={{padding:'4px 10px',borderRadius:6,border:'1px solid '+t.border,fontSize:11,cursor:'pointer',background:t.bgCard,color:t.text}} onClick={()=>concluir(a.id)}>✓</button>}
                  {isGestor&&<button style={{padding:'4px 10px',borderRadius:6,border:'1px solid '+t.border,fontSize:11,cursor:'pointer',background:t.bgCard,color:t.text}} onClick={()=>{setEditForm({...a,cliente_nome:nomeCli(a),cliente_telefone:telCli(a),cliente_endereco:endCli(a),funcionario_id:a.funcionario_id||''});setEditModal(a)}}>✏️</button>}
                  {isGestor&&<button style={{padding:'4px 10px',borderRadius:6,border:'1px solid #FCEBEB',fontSize:11,cursor:'pointer',background:t.bgCard,color:'#A32D2D'}} onClick={()=>apagar(a)}>🗑️</button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
          {agendamentos.length===0&&<div style={{padding:24,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhum agendamento.</div>}
        </div>
      )}
      {modalContent}
    </Layout>
  )
}
