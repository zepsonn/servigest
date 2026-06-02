import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

const STATUS_COLORS = {
  aberta:['#E6F1FB','#185FA5'], em_andamento:['#FAEEDA','#854F0B'],
  concluida:['#EAF3DE','#3B6D11'], cancelada:['#FCEBEB','#A32D2D'],
}
function Badge({s}){ const [bg,c]=STATUS_COLORS[s]||['#F1EFE8','#5F5E5A']; return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{(s||'').replace('_',' ')}</span>}

const CAMPOS_FORM = {cliente_id:'',cliente_nome:'',cliente_telefone:'',cliente_endereco:'',produto:'',servico:'',descricao:'',valor:0,status:'aberta',data_entrada:new Date().toISOString().split('T')[0],data_conclusao:'',tecnico_id:'',observacoes:''}

export default function OS() {
  const [lista, setLista] = useState([])
  const [busca, setBusca] = useState([])
  const [busca2, setBusca2] = useState('')
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [clientes, setClientes] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [user, setUser] = useState(null)
  const [form, setForm] = useState(CAMPOS_FORM)
  const [editForm, setEditForm] = useState({})
  const router = useRouter()

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    setUser(u)
    loadOS()
    supabase.from('clientes').select('id,nome,telefone,endereco').eq('ativo',true).order('nome').then(({data})=>setClientes(data||[]))
    supabase.from('usuarios').select('id,nome').eq('ativo',true).order('nome').then(({data})=>setTecnicos(data||[]))
  },[])

  async function loadOS() {
    const { data } = await supabase.from('ordens_servico').select('*, usuarios(nome)').order('criado_em',{ascending:false})
    setLista(data||[])
  }

  function selecionarCliente(id, target) {
    const c = clientes.find(x=>x.id===id)
    if(c && target==='novo') setForm({...form,cliente_id:c.id,cliente_nome:c.nome,cliente_telefone:c.telefone||'',cliente_endereco:c.endereco||''})
    if(c && target==='edit') setEditForm({...editForm,cliente_id:c.id,cliente_nome:c.nome,cliente_telefone:c.telefone||'',cliente_endereco:c.endereco||''})
  }

  async function salvar() {
    if(!form.data_entrada){ alert('Preencha a data de entrada'); return }
    await supabase.from('ordens_servico').insert([{...form,valor:Number(form.valor)||0,cliente_id:form.cliente_id||null,tecnico_id:form.tecnico_id||null,data_conclusao:form.data_conclusao||null}])
    setModal(false); setForm(CAMPOS_FORM); loadOS()
  }

  async function salvarEdicao() {
    await supabase.from('ordens_servico').update({
      cliente_nome:editForm.cliente_nome, cliente_telefone:editForm.cliente_telefone,
      cliente_endereco:editForm.cliente_endereco, produto:editForm.produto,
      servico:editForm.servico, descricao:editForm.descricao,
      valor:Number(editForm.valor)||0, status:editForm.status,
      data_entrada:editForm.data_entrada, data_conclusao:editForm.data_conclusao||null,
      tecnico_id:editForm.tecnico_id||null, observacoes:editForm.observacoes,
    }).eq('id', editModal.id)
    setEditModal(null); loadOS()
  }

  async function apagar(os) {
    if(!confirm('Apagar a OS #'+os.numero+' de "'+os.cliente_nome+'"? Esta ação não pode ser desfeita.')) return
    await supabase.from('ordens_servico').delete().eq('id', os.id)
    loadOS()
  }

  async function atualizarStatus(id, status) {
    await supabase.from('ordens_servico').update({status,...(status==='concluida'?{data_conclusao:new Date().toISOString().split('T')[0]}:{})}).eq('id',id)
    loadOS()
  }

  const filtradas = lista.filter(os =>
    (os.cliente_nome||'').toLowerCase().includes(busca2.toLowerCase()) ||
    (os.cliente_telefone||'').includes(busca2) ||
    String(os.numero).includes(busca2) ||
    (os.servico||'').toLowerCase().includes(busca2.toLowerCase()) ||
    (os.produto||'').toLowerCase().includes(busca2.toLowerCase())
  )

  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const servicos = ['Limpeza residencial','Limpeza comercial','Manutenção','Instalação','Reparo elétrico','Troca de peças','Diagnóstico','Orçamento','Outro']

  function FormOS({f, setF, target}) {
    return <>
      <div style={sg.section}>CLIENTE</div>
      <div style={sg.fg}><label style={sg.label}>Selecionar cliente cadastrado</label>
        <select style={sg.input} onChange={e=>selecionarCliente(e.target.value,target)}>
          <option value="">— Selecione ou preencha manualmente —</option>
          {clientes.map(c=><option key={c.id} value={c.id}>{c.nome} · {c.telefone}</option>)}
        </select>
      </div>
      <div style={sg.row2}>
        <div style={sg.fg}><label style={sg.label}>Nome</label><input style={sg.input} value={f.cliente_nome||''} onChange={e=>setF({...f,cliente_nome:e.target.value})} /></div>
        <div style={sg.fg}><label style={sg.label}>Telefone</label><input style={sg.input} value={f.cliente_telefone||''} onChange={e=>setF({...f,cliente_telefone:e.target.value})} /></div>
      </div>
      <div style={sg.fg}><label style={sg.label}>Endereço</label><input style={sg.input} value={f.cliente_endereco||''} onChange={e=>setF({...f,cliente_endereco:e.target.value})} /></div>
      <div style={sg.section}>SERVIÇO</div>
      <div style={sg.row2}>
        <div style={sg.fg}><label style={sg.label}>Produto / Equipamento</label><input style={sg.input} value={f.produto||''} placeholder="Ex: Geladeira Brastemp" onChange={e=>setF({...f,produto:e.target.value})} /></div>
        <div style={sg.fg}><label style={sg.label}>Serviço realizado</label><input style={sg.input} value={f.servico||''} placeholder="Ex: Troca de compressor" onChange={e=>setF({...f,servico:e.target.value})} /></div>
      </div>
      <div style={sg.fg}><label style={sg.label}>Descrição / Diagnóstico</label><textarea style={{...sg.input,minHeight:70,resize:'vertical'}} value={f.descricao||''} onChange={e=>setF({...f,descricao:e.target.value})} /></div>
      <div style={sg.row2}>
        <div style={sg.fg}><label style={sg.label}>Valor (R$)</label><input style={sg.input} type="number" value={f.valor||0} onChange={e=>setF({...f,valor:e.target.value})} /></div>
        <div style={sg.fg}><label style={sg.label}>Status</label>
          <select style={sg.input} value={f.status||'aberta'} onChange={e=>setF({...f,status:e.target.value})}>
            <option value="aberta">Aberta</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>
      <div style={sg.row2}>
        <div style={sg.fg}><label style={sg.label}>Data de entrada *</label><input style={sg.input} type="date" value={f.data_entrada||''} onChange={e=>setF({...f,data_entrada:e.target.value})} /></div>
        <div style={sg.fg}><label style={sg.label}>Data de conclusão</label><input style={sg.input} type="date" value={f.data_conclusao||''} onChange={e=>setF({...f,data_conclusao:e.target.value})} /></div>
      </div>
      <div style={sg.fg}><label style={sg.label}>Técnico responsável</label>
        <select style={sg.input} value={f.tecnico_id||''} onChange={e=>setF({...f,tecnico_id:e.target.value})}>
          <option value="">Selecione...</option>
          {tecnicos.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
      </div>
      <div style={sg.fg}><label style={sg.label}>Observações</label><textarea style={{...sg.input,minHeight:60,resize:'vertical'}} value={f.observacoes||''} onChange={e=>setF({...f,observacoes:e.target.value})} /></div>
    </>
  }

  return (
    <Layout title="Ordens de Serviço">
      <div style={s.toolbar}>
        <input style={s.search} placeholder="🔍 Buscar por nome, telefone, nº OS, produto ou serviço..." value={busca2} onChange={e=>setBusca2(e.target.value)} />
        <button style={s.btnPrimary} onClick={()=>setModal(true)}>+ Nova OS</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[['Abertas','aberta','#185FA5'],['Em andamento','em_andamento','#854F0B'],['Concluídas','concluida','#3B6D11'],['Canceladas','cancelada','#A32D2D']].map(([label,st,color])=>(
          <div key={st} style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:'12px 16px'}}>
            <div style={{fontSize:11,color:'#888',marginBottom:4}}>{label}</div>
            <div style={{fontSize:22,fontWeight:700,color}}>{lista.filter(o=>o.status===st).length}</div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <table style={s.table}>
          <thead><tr>{['Nº','Cliente','Telefone','Produto/Serviço','Valor','Data','Técnico','Status','Ações'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{filtradas.map(os=>(
            <tr key={os.id}>
              <td style={s.td}><strong>#{os.numero}</strong></td>
              <td style={s.td}>{os.cliente_nome||'—'}</td>
              <td style={s.td}>{os.cliente_telefone||'—'}</td>
              <td style={s.td}><div style={{fontSize:12}}><div style={{fontWeight:500}}>{os.produto||'—'}</div><div style={{color:'#888'}}>{os.servico||'—'}</div></div></td>
              <td style={s.td}>{fmt(os.valor)}</td>
              <td style={s.td}>{os.data_entrada ? new Date(os.data_entrada+'T12:00').toLocaleDateString('pt-BR') : '—'}</td>
              <td style={s.td}>{os.usuarios?.nome||'—'}</td>
              <td style={s.td}><Badge s={os.status}/></td>
              <td style={s.td}>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {os.status!=='concluida'&&os.status!=='cancelada'&&<button style={{...s.btnSm,background:'#1D9E75',color:'#fff',border:'none'}} onClick={()=>atualizarStatus(os.id,'concluida')}>✓</button>}
                  <button style={s.btnSm} onClick={()=>{setEditForm({...os,tecnico_id:os.tecnico_id||''});setEditModal(os)}}>✏️</button>
                  <button style={s.btnSm} onClick={()=>router.push('/recibo?os='+os.id)}>🧾</button>
                  <button style={{...s.btnSm,color:'#A32D2D',borderColor:'#FCEBEB'}} onClick={()=>apagar(os)}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {filtradas.length===0 && <div style={{padding:24,textAlign:'center',color:'#aaa',fontSize:13}}>Nenhuma OS encontrada.</div>}
      </div>

      {/* MODAL NOVA OS */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.mHead}><span>Nova Ordem de Serviço</span><button style={s.xBtn} onClick={()=>{setModal(false);setForm(CAMPOS_FORM)}}>×</button></div>
            <FormOS f={form} setF={setForm} target="novo" />
            <div style={s.btnRow}><button style={s.btnSecondary} onClick={()=>{setModal(false);setForm(CAMPOS_FORM)}}>Cancelar</button><button style={s.btnPrimary} onClick={salvar}>Salvar OS</button></div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR OS */}
      {editModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.mHead}><span>Editar OS #{editModal.numero}</span><button style={s.xBtn} onClick={()=>setEditModal(null)}>×</button></div>
            <FormOS f={editForm} setF={setEditForm} target="edit" />
            <div style={s.btnRow}><button style={s.btnSecondary} onClick={()=>setEditModal(null)}>Cancelar</button><button style={s.btnPrimary} onClick={salvarEdicao}>Salvar alterações</button></div>
          </div>
        </div>
      )}
    </Layout>
  )
}

const s = {
  toolbar:{display:'flex',gap:8,marginBottom:16},
  search:{flex:1,padding:'8px 14px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:13,fontFamily:'inherit'},
  card:{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,overflow:'hidden'},
  table:{width:'100%',borderCollapse:'collapse',fontSize:13},
  th:{textAlign:'left',padding:'8px 12px',color:'#888',fontWeight:500,fontSize:11,background:'#fafaf8',borderBottom:'1px solid #f0f0f0'},
  td:{padding:'9px 12px',borderBottom:'1px solid #f8f8f8',verticalAlign:'middle'},
  btnSm:{padding:'4px 9px',borderRadius:6,border:'1px solid #e0e0e0',fontSize:11,cursor:'pointer',background:'#fff',fontFamily:'inherit'},
  btnPrimary:{padding:'7px 16px',borderRadius:8,background:'#1D9E75',color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500,fontFamily:'inherit'},
  btnSecondary:{padding:'7px 14px',borderRadius:8,background:'transparent',color:'#666',border:'1px solid #e0e0e0',fontSize:13,cursor:'pointer',fontFamily:'inherit'},
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'},
  modal:{background:'#fff',borderRadius:12,padding:24,width:580,maxWidth:'96vw',maxHeight:'92vh',overflow:'auto'},
  mHead:{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'},
  xBtn:{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'},
  btnRow:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16},
}
const sg = {
  section:{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'#aaa',margin:'16px 0 8px',paddingBottom:6,borderBottom:'1px solid #f0f0f0'},
  fg:{marginBottom:12},
  label:{display:'block',fontSize:11,color:'#888',fontWeight:500,marginBottom:3},
  input:{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:13,fontFamily:'inherit'},
  row2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12},
}
