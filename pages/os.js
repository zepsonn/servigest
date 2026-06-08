import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { useRouter } from 'next/router'

const STATUS_COLORS = {
  em_andamento:['#FAEEDA','#854F0B'],
  concluida:['#EAF3DE','#3B6D11'],
}
function Badge({s}){ const [bg,c]=STATUS_COLORS[s]||['#F1EFE8','#5F5E5A']; return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{(s||'').replace('_',' ')}</span>}

const FORM0 = {agendamento_id:'',cliente_id:'',cliente_nome:'',cliente_telefone:'',cliente_endereco:'',produto:'',servico:'',descricao:'',valor:0,status:'em_andamento',data_entrada:new Date().toISOString().split('T')[0],data_conclusao:'',tecnico_id:'',observacoes:''}

// componentes fora (corrige bug de foco)
function Modal({title,onClose,children,t,wide}){
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
    <div style={{background:t.bgCard,borderRadius:12,padding:24,width:wide?580:460,maxWidth:'96vw',maxHeight:'92vh',overflow:'auto',border:'1px solid '+t.border}}>
      <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center',color:t.text}}><span>{title}</span><button style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:t.textSoft}} onClick={onClose}>×</button></div>
      {children}
    </div>
  </div>
}
function Sec({label,t}){return <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:t.textSoft,margin:'16px 0 8px',paddingBottom:6,borderBottom:'1px solid '+t.borderSoft}}>{label}</div>}
function FG({label,value,onChange,t,textarea,type,placeholder}){
  const st={width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit',background:t.bgInput,color:t.text,minHeight:textarea?70:undefined,resize:textarea?'vertical':undefined}
  return <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}}>{label}</label>{textarea?<textarea style={st} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>:<input style={st} type={type||'text'} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>}</div>
}
function BtnRow({onCancel,onSave,t,label}){return <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}><button style={{padding:'7px 14px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:13,cursor:'pointer',fontFamily:'inherit'}} onClick={onCancel}>Cancelar</button><button style={{padding:'7px 14px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontFamily:'inherit',fontWeight:500}} onClick={onSave}>{label||'Salvar'}</button></div>}

function FormOS({f,setF,target,t,agendamentos,tecnicos,selAg}) {
  const row2={display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}
  const inp={width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit',background:t.bgInput,color:t.text}
  const lbl={display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}
  return <>
    <Sec label="CLIENTE / AGENDAMENTO" t={t}/>
    {target==='novo' && (
      <div style={{marginBottom:12}}>
        <label style={lbl}>Puxar de um agendamento</label>
        <select style={inp} value={f.agendamento_id||''} onChange={e=>selAg(e.target.value)}>
          <option value="">— Selecione um agendamento ou preencha abaixo —</option>
          {agendamentos.map(a=><option key={a.id} value={a.id}>{(a.cliente_nome||a.clientes?.nome||'Sem nome')}{a.cliente_telefone?' · '+a.cliente_telefone:''}{a.servico&&a.servico!=='Cliente migrado'?' · '+a.servico:''}</option>)}
        </select>
      </div>
    )}
    <div style={row2}>
      <FG label="Nome" value={f.cliente_nome||''} onChange={v=>setF({...f,cliente_nome:v})} t={t}/>
      <FG label="Telefone" value={f.cliente_telefone||''} onChange={v=>setF({...f,cliente_telefone:v})} t={t}/>
    </div>
    <FG label="Endereço" value={f.cliente_endereco||''} onChange={v=>setF({...f,cliente_endereco:v})} t={t}/>
    <Sec label="SERVIÇO" t={t}/>
    <div style={row2}>
      <FG label="Produto/Equipamento" value={f.produto||''} onChange={v=>setF({...f,produto:v})} t={t} placeholder="Ex: Geladeira Brastemp"/>
      <FG label="Serviço realizado" value={f.servico||''} onChange={v=>setF({...f,servico:v})} t={t} placeholder="Ex: Troca de compressor"/>
    </div>
    <FG label="Descrição / Diagnóstico" value={f.descricao||''} onChange={v=>setF({...f,descricao:v})} t={t} textarea/>
    <div style={row2}>
      <FG label="Valor (R$)" value={f.valor||0} onChange={v=>setF({...f,valor:v})} t={t} type="number"/>
      <div style={{marginBottom:12}}><label style={lbl}>Status</label>
        <select style={inp} value={f.status||'em_andamento'} onChange={e=>setF({...f,status:e.target.value})}>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
        </select>
      </div>
    </div>
    <div style={row2}>
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
  const router = useRouter()

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    setUser(u); loadOS(); loadAgendamentos()
    supabase.from('usuarios').select('id,nome').eq('ativo',true).order('nome').then(({data})=>setTecnicos(data||[]))
  },[])

  async function loadOS() {
    const { data } = await supabase.from('ordens_servico').select('*, usuarios(nome)').order('criado_em',{ascending:false})
    setLista(data||[])
  }
  async function loadAgendamentos() {
    const { data } = await supabase.from('agendamentos').select('*, clientes(nome)').order('criado_em',{ascending:false})
    setAgendamentos(data||[])
  }

  function selAg(id) {
    const a = agendamentos.find(x=>x.id===id)
    if (!a) { setForm(prev=>({...prev,agendamento_id:''})); return }
    setForm(prev=>({
      ...prev,
      agendamento_id:a.id,
      cliente_id:a.cliente_id||'',
      cliente_nome:a.cliente_nome||a.clientes?.nome||'',
      cliente_telefone:a.cliente_telefone||'',
      cliente_endereco:a.cliente_endereco||'',
      servico:(a.servico&&a.servico!=='Cliente migrado')?a.servico:prev.servico,
      valor:a.valor||prev.valor,
    }))
  }

  async function salvar() {
    if (!form.data_entrada) { alert('Preencha a data'); return }
    await supabase.from('ordens_servico').insert([{
      cliente_id:form.cliente_id||null,cliente_nome:form.cliente_nome,
      cliente_telefone:form.cliente_telefone,cliente_endereco:form.cliente_endereco,
      produto:form.produto,servico:form.servico,descricao:form.descricao,
      valor:Number(form.valor)||0,status:form.status,
      data_entrada:form.data_entrada,data_conclusao:form.data_conclusao||null,
      tecnico_id:form.tecnico_id||null,observacoes:form.observacoes,
    }])
    setModal(false); setForm(FORM0); loadOS()
  }
  async function salvarEdicao() {
    await supabase.from('ordens_servico').update({
      cliente_nome:editForm.cliente_nome,cliente_telefone:editForm.cliente_telefone,
      cliente_endereco:editForm.cliente_endereco,produto:editForm.produto,
      servico:editForm.servico,descricao:editForm.descricao,
      valor:Number(editForm.valor)||0,status:editForm.status,
      data_entrada:editForm.data_entrada,data_conclusao:editForm.data_conclusao||null,
      tecnico_id:editForm.tecnico_id||null,observacoes:editForm.observacoes,
    }).eq('id',editModal.id)
    setEditModal(null); loadOS()
  }
  async function apagar(os) {
    if (!confirm('Apagar OS #'+os.numero+'?')) return
    await supabase.from('ordens_servico').delete().eq('id',os.id); loadOS()
  }
  async function concluir(id) {
    await supabase.from('ordens_servico').update({status:'concluida',data_conclusao:new Date().toISOString().split('T')[0]}).eq('id',id); loadOS()
  }

  const filtradas = lista.filter(o =>
    (o.cliente_nome||'').toLowerCase().includes(busca.toLowerCase()) ||
    (o.cliente_telefone||'').includes(busca) ||
    String(o.numero).includes(busca) ||
    (o.servico||'').toLowerCase().includes(busca.toLowerCase()) ||
    (o.produto||'').toLowerCase().includes(busca.toLowerCase())
  )
  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const s = mk(t)

  return (
    <Layout title="Ordens de Serviço">
      <div style={s.toolbar}>
        <input style={s.search} placeholder="Buscar por nome, telefone, nº OS, produto ou serviço..." value={busca} onChange={e=>setBusca(e.target.value)}/>
        <button style={s.btnPrimary} onClick={()=>setModal(true)}>+ Nova OS</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:20}}>
        {[['Em andamento','em_andamento','#854F0B'],['Concluídas','concluida','#3B6D11']].map(([label,st,color])=>(
          <div key={st} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'12px 16px'}}>
            <div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>{label}</div>
            <div style={{fontSize:22,fontWeight:700,color}}>{lista.filter(o=>o.status===st).length}</div>
          </div>
        ))}
      </div>
      <div style={s.card}>
        <table style={s.table}>
          <thead><tr>{['Nº','Cliente','Telefone','Produto/Serviço','Valor','Data','Técnico','Status','Ações'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{filtradas.map(o=>(
            <tr key={o.id}>
              <td style={s.td}><strong style={{color:t.text}}>#{o.numero}</strong></td>
              <td style={s.td}>{o.cliente_nome||'—'}</td>
              <td style={s.td}>{o.cliente_telefone||'—'}</td>
              <td style={s.td}><div style={{fontSize:12}}><div style={{fontWeight:500,color:t.text}}>{o.produto||'—'}</div><div style={{color:t.textSoft}}>{o.servico||'—'}</div></div></td>
              <td style={s.td}>{fmt(o.valor)}</td>
              <td style={s.td}>{o.data_entrada?new Date(o.data_entrada+'T12:00').toLocaleDateString('pt-BR'):'—'}</td>
              <td style={s.td}>{o.usuarios?.nome||'—'}</td>
              <td style={s.td}><Badge s={o.status}/></td>
              <td style={s.td}><div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {o.status!=='concluida'&&<button style={{...s.btnSm,background:t.accent,color:'#fff',border:'none'}} onClick={()=>concluir(o.id)}>✓</button>}
                <button style={s.btnSm} onClick={()=>{setEditForm({...o,tecnico_id:o.tecnico_id||''});setEditModal(o)}}>✏️</button>
                <button style={s.btnSm} onClick={()=>router.push('/recibo?os='+o.id)}>🧾</button>
                <button style={{...s.btnSm,color:'#A32D2D',borderColor:'#FCEBEB'}} onClick={()=>apagar(o)}>🗑️</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
        {filtradas.length===0&&<div style={{padding:24,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhuma OS encontrada.</div>}
      </div>

      {modal&&<Modal title="Nova OS" onClose={()=>{setModal(false);setForm(FORM0)}} t={t} wide>
        <FormOS f={form} setF={setForm} target="novo" t={t} agendamentos={agendamentos} tecnicos={tecnicos} selAg={selAg}/>
        <BtnRow onCancel={()=>{setModal(false);setForm(FORM0)}} onSave={salvar} t={t} label="Salvar OS"/>
      </Modal>}

      {editModal&&<Modal title={'Editar OS #'+editModal.numero} onClose={()=>setEditModal(null)} t={t} wide>
        <FormOS f={editForm} setF={setEditForm} target="edit" t={t} agendamentos={agendamentos} tecnicos={tecnicos} selAg={selAg}/>
        <BtnRow onCancel={()=>setEditModal(null)} onSave={salvarEdicao} t={t} label="Salvar alterações"/>
      </Modal>}
    </Layout>
  )
}

function mk(t){return{
  toolbar:{display:'flex',gap:8,marginBottom:16},
  search:{flex:1,padding:'8px 14px',borderRadius:8,border:'1px solid '+t.border,background:t.bgInput,fontSize:13,fontFamily:'inherit',color:t.text},
  card:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,overflow:'hidden'},
  table:{width:'100%',borderCollapse:'collapse',fontSize:13},
  th:{textAlign:'left',padding:'8px 12px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft},
  td:{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text},
  btnSm:{padding:'4px 9px',borderRadius:6,border:'1px solid '+t.border,fontSize:11,cursor:'pointer',background:t.bgCard,fontFamily:'inherit',color:t.text},
  btnPrimary:{padding:'7px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500,fontFamily:'inherit'},
}}
