import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { useRouter } from 'next/router'

function useIsMobile(){ const [m,setM]=useState(false); useEffect(()=>{const c=()=>setM(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);return m }
const STATUS_COLORS = {em_andamento:['#FAEEDA','#854F0B'],concluida:['#EAF3DE','#3B6D11']}
function Badge({s}){ const [bg,c]=STATUS_COLORS[s]||['#F1EFE8','#5F5E5A']; return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{(s||'').replace('_',' ')}</span>}
const FORM0 = {agendamento_id:'',cliente_id:'',cliente_nome:'',cliente_telefone:'',cliente_endereco:'',produto:'',servico:'',descricao:'',valor:0,status:'em_andamento',data_entrada:new Date().toISOString().split('T')[0],data_conclusao:'',tecnico_id:'',observacoes:''}

// fora do componente (corrige bug de foco)
function Modal({title,onClose,children,t,isMobile}){
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:isMobile?'flex-end':'center',justifyContent:'center'}}>
    <div style={{background:t.bgCard,borderRadius:isMobile?'16px 16px 0 0':12,padding:20,width:isMobile?'100%':580,maxWidth:'100vw',maxHeight:isMobile?'92vh':'92vh',overflow:'auto',border:'1px solid '+t.border}}>
      <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}><span>{title}</span><button style={{background:'none',border:'none',fontSize:24,cursor:'pointer',color:t.textSoft}} onClick={onClose}>×</button></div>
      {children}
    </div>
  </div>
}
function FG({label,value,onChange,t,textarea,type,placeholder}){
  const st={width:'100%',padding:'9px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:14,fontFamily:'inherit',background:t.bgInput,color:t.text,minHeight:textarea?70:undefined,resize:textarea?'vertical':undefined}
  return <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}}>{label}</label>{textarea?<textarea style={st} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>:<input style={st} type={type||'text'} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>}</div>
}
function BtnRow({onCancel,onSave,t,label}){return <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}><button style={{padding:'10px 16px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:14,cursor:'pointer'}} onClick={onCancel}>Cancelar</button><button style={{padding:'10px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:14,cursor:'pointer',fontWeight:500}} onClick={onSave}>{label||'Salvar'}</button></div>}
function Sec({label,t}){return <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:t.textSoft,margin:'14px 0 8px',paddingBottom:6,borderBottom:'1px solid '+t.borderSoft}}>{label}</div>}

function FormOS({f,setF,t,agendamentos,tecnicos,selAg}){
  const inp={width:'100%',padding:'9px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:14,fontFamily:'inherit',background:t.bgInput,color:t.text}
  const lbl={display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}
  return <>
    <Sec label="CLIENTE / AGENDAMENTO" t={t}/>
    <div style={{marginBottom:12}}><label style={lbl}>Puxar de um agendamento</label>
      <select style={inp} value={f.agendamento_id||''} onChange={e=>selAg(e.target.value)}>
        <option value="">— Selecione ou preencha abaixo —</option>
        {agendamentos.map(a=><option key={a.id} value={a.id}>{(a.cliente_nome||a.clientes?.nome||'Sem nome')}{a.cliente_telefone?' · '+a.cliente_telefone:''}{a.servico&&a.servico!=='Cliente migrado'?' · '+a.servico:''}</option>)}
      </select>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
      <FG label="Nome" value={f.cliente_nome||''} onChange={v=>setF({...f,cliente_nome:v})} t={t}/>
      <FG label="Telefone" value={f.cliente_telefone||''} onChange={v=>setF({...f,cliente_telefone:v})} t={t}/>
    </div>
    <FG label="Endereço" value={f.cliente_endereco||''} onChange={v=>setF({...f,cliente_endereco:v})} t={t}/>
    <Sec label="SERVIÇO" t={t}/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
      <FG label="Produto" value={f.produto||''} onChange={v=>setF({...f,produto:v})} t={t} placeholder="Ex: Geladeira"/>
      <FG label="Serviço" value={f.servico||''} onChange={v=>setF({...f,servico:v})} t={t} placeholder="Ex: Manutenção"/>
    </div>
    <FG label="Diagnóstico" value={f.descricao||''} onChange={v=>setF({...f,descricao:v})} t={t} textarea/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
      <FG label="Valor (R$)" value={f.valor||0} onChange={v=>setF({...f,valor:v})} t={t} type="number"/>
      <div style={{marginBottom:12}}><label style={lbl}>Status</label>
        <select style={inp} value={f.status||'em_andamento'} onChange={e=>setF({...f,status:e.target.value})}>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
        </select>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
      <FG label="Data entrada *" value={f.data_entrada||''} onChange={v=>setF({...f,data_entrada:v})} t={t} type="date"/>
      <FG label="Data conclusão" value={f.data_conclusao||''} onChange={v=>setF({...f,data_conclusao:v})} t={t} type="date"/>
    </div>
    <div style={{marginBottom:12}}><label style={lbl}>Técnico</label>
      <select style={inp} value={f.tecnico_id||''} onChange={e=>setF({...f,tecnico_id:e.target.value})}>
        <option value="">Selecione...</option>
        {tecnicos.map(tc=><option key={tc.id} value={tc.id}>{tc.nome}</option>)}
      </select>
    </div>
    <FG label="Observações" value={f.observacoes||''} onChange={v=>setF({...f,observacoes:v})} t={t} textarea/>
  </>
}

export default function OS() {
  const [lista, setLista] = useState([])
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [agendamentos, setAgendamentos] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [user, setUser] = useState(null)
  const [form, setForm] = useState(FORM0)
  const [editForm, setEditForm] = useState({})
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const router = useRouter()

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    setUser(u); loadOS(); loadAgendamentos()
    supabase.from('usuarios').select('id,nome').eq('ativo',true).order('nome').then(({data})=>setTecnicos(data||[]))
  },[])

  async function loadOS(){
    const{data}=await supabase.from('ordens_servico').select('*, usuarios(nome)').order('cliente_nome')
    setLista(data||[])
  }
  async function loadAgendamentos(){
    const{data}=await supabase.from('agendamentos').select('*, clientes(nome)').order('criado_em',{ascending:false})
    setAgendamentos(data||[])
  }
  function selAg(id){
    const a=agendamentos.find(x=>x.id===id)
    if(!a){setForm(prev=>({...prev,agendamento_id:''}));return}
    setForm(prev=>({...prev,agendamento_id:a.id,cliente_id:a.cliente_id||'',cliente_nome:a.cliente_nome||a.clientes?.nome||'',cliente_telefone:a.cliente_telefone||'',cliente_endereco:a.cliente_endereco||'',servico:(a.servico&&a.servico!=='Cliente migrado')?a.servico:prev.servico,valor:a.valor||prev.valor}))
  }
  async function salvar(){
    if(!form.data_entrada){alert('Preencha a data');return}
    const {agendamento_id, ...formData} = form
    await supabase.from('ordens_servico').insert([{...formData,valor:Number(form.valor)||0,cliente_id:form.cliente_id||null,tecnico_id:form.tecnico_id||null,data_conclusao:form.data_conclusao||null}])
    setModal(false); setForm(FORM0); loadOS()
  }
  async function salvarEdicao(){
    await supabase.from('ordens_servico').update({cliente_nome:editForm.cliente_nome,cliente_telefone:editForm.cliente_telefone,cliente_endereco:editForm.cliente_endereco,produto:editForm.produto,servico:editForm.servico,descricao:editForm.descricao,valor:Number(editForm.valor)||0,status:editForm.status,data_entrada:editForm.data_entrada,data_conclusao:editForm.data_conclusao||null,tecnico_id:editForm.tecnico_id||null,observacoes:editForm.observacoes}).eq('id',editModal.id)
    setEditModal(null); loadOS()
  }
  async function apagar(os){
    if(!confirm('Apagar OS #'+os.numero+'?'))return
    await supabase.from('ordens_servico').delete().eq('id',os.id); loadOS()
  }
  async function concluir(id){
    await supabase.from('ordens_servico').update({status:'concluida',data_conclusao:new Date().toISOString().split('T')[0]}).eq('id',id); loadOS()
  }
  const filtradas=lista.filter(o=>(o.cliente_nome||'').toLowerCase().includes(busca.toLowerCase())||(o.cliente_telefone||'').includes(busca)||String(o.numero).includes(busca)||(o.servico||'').toLowerCase().includes(busca.toLowerCase())||(o.produto||'').toLowerCase().includes(busca.toLowerCase()))
  const fmt=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const isGestor=user?.role==='gestor'
  const inp={width:'100%',padding:'9px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:14,fontFamily:'inherit',background:t.bgInput,color:t.text}
  const lbl={display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}

  return (
    <Layout title="Ordens de Serviço">
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        <input style={{flex:1,padding:'9px 14px',borderRadius:8,border:'1px solid '+t.border,background:t.bgInput,fontSize:13,fontFamily:'inherit',color:t.text}} placeholder="Buscar OS..." value={busca} onChange={e=>setBusca(e.target.value)}/>
        <button style={{padding:'9px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500,whiteSpace:'nowrap'}} onClick={()=>setModal(true)}>+ Nova OS</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
        {[['Em andamento','em_andamento','#854F0B'],['Concluídas','concluida','#3B6D11']].map(([label,st,color])=>(
          <div key={st} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'12px 14px'}}>
            <div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>{label}</div>
            <div style={{fontSize:22,fontWeight:700,color}}>{lista.filter(o=>o.status===st).length}</div>
          </div>
        ))}
      </div>

      {isMobile ? (
        // MOBILE: cards
        <div>
          {filtradas.map(o=>(
            <div key={o.id} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:14,marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                <div>
                  <div style={{fontWeight:600,color:t.text,fontSize:15}}>#{o.numero} · {o.cliente_nome||'—'}</div>
                  <div style={{fontSize:12,color:t.textSoft,marginTop:2}}>{o.cliente_telefone||''}</div>
                </div>
                <Badge s={o.status}/>
              </div>
              <div style={{fontSize:13,color:t.text,marginBottom:2}}>{o.produto||'—'} {o.servico?'· '+o.servico:''}</div>
              <div style={{fontSize:12,color:t.textSoft,marginBottom:6}}>{o.data_entrada?new Date(o.data_entrada+'T12:00').toLocaleDateString('pt-BR'):''} {o.usuarios?.nome?'· '+o.usuarios.nome:''}</div>
              <div style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:10}}>{fmt(o.valor)}</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {o.status!=='concluida'&&<button style={{flex:1,padding:'8px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:500}} onClick={()=>concluir(o.id)}>✓ Concluir</button>}
                <button style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid '+t.border,background:t.bgCard,color:t.text,fontSize:12,cursor:'pointer'}} onClick={()=>{setEditForm({...o,tecnico_id:o.tecnico_id||''});setEditModal(o)}}>✏️ Editar</button>
                <button style={{padding:'8px 12px',borderRadius:8,border:'1px solid '+t.border,background:t.bgCard,color:t.text,fontSize:12,cursor:'pointer'}} onClick={()=>router.push('/recibo?os='+o.id)}>🧾</button>
                {isGestor&&<button style={{padding:'8px 12px',borderRadius:8,border:'1px solid #FCEBEB',background:t.bgCard,color:'#A32D2D',fontSize:12,cursor:'pointer'}} onClick={()=>apagar(o)}>🗑️</button>}
              </div>
            </div>
          ))}
          {filtradas.length===0&&<div style={{padding:32,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhuma OS encontrada.</div>}
        </div>
      ):(
        // DESKTOP: tabela
        <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr>{['Nº','Cliente','Telefone','Produto/Serviço','Valor','Data','Técnico','Status','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 12px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft}}>{h}</th>)}</tr></thead>
            <tbody>{filtradas.map(o=>(
              <tr key={o.id}>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}><strong>#{o.numero}</strong></td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{o.cliente_nome||'—'}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{o.cliente_telefone||'—'}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}><div style={{fontWeight:500}}>{o.produto||'—'}</div><div style={{fontSize:11,color:t.textSoft}}>{o.servico||'—'}</div></td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{fmt(o.valor)}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{o.data_entrada?new Date(o.data_entrada+'T12:00').toLocaleDateString('pt-BR'):'—'}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{o.usuarios?.nome||'—'}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft}}><Badge s={o.status}/></td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft}}><div style={{display:'flex',gap:4}}>
                  {o.status!=='concluida'&&<button style={{padding:'4px 8px',borderRadius:6,border:'none',background:t.accent,color:'#fff',fontSize:11,cursor:'pointer'}} onClick={()=>concluir(o.id)}>✓</button>}
                  <button style={{padding:'4px 8px',borderRadius:6,border:'1px solid '+t.border,background:t.bgCard,color:t.text,fontSize:11,cursor:'pointer'}} onClick={()=>{setEditForm({...o,tecnico_id:o.tecnico_id||''});setEditModal(o)}}>✏️</button>
                  <button style={{padding:'4px 8px',borderRadius:6,border:'1px solid '+t.border,background:t.bgCard,color:t.text,fontSize:11,cursor:'pointer'}} onClick={()=>router.push('/recibo?os='+o.id)}>🧾</button>
                  {isGestor&&<button style={{padding:'4px 8px',borderRadius:6,border:'1px solid #FCEBEB',background:t.bgCard,color:'#A32D2D',fontSize:11,cursor:'pointer'}} onClick={()=>apagar(o)}>🗑️</button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
          {filtradas.length===0&&<div style={{padding:24,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhuma OS.</div>}
        </div>
      )}

      {modal&&<Modal title="Nova OS" onClose={()=>{setModal(false);setForm(FORM0)}} t={t} isMobile={isMobile}>
        <FormOS f={form} setF={setForm} t={t} agendamentos={agendamentos} tecnicos={tecnicos} selAg={selAg}/>
        <BtnRow onCancel={()=>{setModal(false);setForm(FORM0)}} onSave={salvar} t={t} label="Salvar OS"/>
      </Modal>}
      {editModal&&<Modal title={'Editar OS #'+editModal.numero} onClose={()=>setEditModal(null)} t={t} isMobile={isMobile}>
        <FormOS f={editForm} setF={setEditForm} t={t} agendamentos={agendamentos} tecnicos={tecnicos} selAg={()=>{}}/>
        <BtnRow onCancel={()=>setEditModal(null)} onSave={salvarEdicao} t={t} label="Salvar alterações"/>
      </Modal>}
    </Layout>
  )
}
