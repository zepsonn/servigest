import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

const STATUS_COLORS = {
  aberta: ['#E6F1FB','#185FA5'],
  em_andamento: ['#FAEEDA','#854F0B'],
  concluida: ['#EAF3DE','#3B6D11'],
  cancelada: ['#FCEBEB','#A32D2D'],
}
function Badge({s}){ const [bg,c]=STATUS_COLORS[s]||['#F1EFE8','#5F5E5A']; return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{s.replace('_',' ')}</span>}

export default function OS() {
  const [lista, setLista] = useState([])
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [clientes, setClientes] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({
    cliente_id:'', cliente_nome:'', cliente_telefone:'', cliente_endereco:'',
    produto:'', servico:'', descricao:'', valor:0,
    status:'aberta', data_entrada:new Date().toISOString().split('T')[0],
    data_conclusao:'', tecnico_id:'', observacoes:''
  })
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

  function selecionarCliente(id) {
    const c = clientes.find(x=>x.id===id)
    if(c) setForm({...form, cliente_id:c.id, cliente_nome:c.nome, cliente_telefone:c.telefone||'', cliente_endereco:c.endereco||''})
    else setForm({...form, cliente_id:''})
  }

  async function salvar() {
    if(!form.data_entrada){ alert('Preencha a data de entrada'); return }
    await supabase.from('ordens_servico').insert([{
      ...form,
      valor: Number(form.valor)||0,
      cliente_id: form.cliente_id||null,
      tecnico_id: form.tecnico_id||null,
      data_conclusao: form.data_conclusao||null,
    }])
    setModal(false)
    resetForm()
    loadOS()
  }

  async function atualizarStatus(id, status) {
    await supabase.from('ordens_servico').update({status, ...(status==='concluida'?{data_conclusao:new Date().toISOString().split('T')[0]}:{})}).eq('id',id)
    loadOS()
  }

  function resetForm(){
    setForm({cliente_id:'',cliente_nome:'',cliente_telefone:'',cliente_endereco:'',produto:'',servico:'',descricao:'',valor:0,status:'aberta',data_entrada:new Date().toISOString().split('T')[0],data_conclusao:'',tecnico_id:'',observacoes:''})
  }

  const filtradas = lista.filter(os =>
    (os.cliente_nome||'').toLowerCase().includes(busca.toLowerCase()) ||
    (os.cliente_telefone||'').includes(busca) ||
    String(os.numero).includes(busca) ||
    (os.servico||'').toLowerCase().includes(busca.toLowerCase())
  )

  const fmt = n => Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})

  return (
    <Layout title="Ordens de Serviço">
      <div style={s.toolbar}>
        <input style={s.search} placeholder="🔍 Buscar por nome, telefone, nº OS ou serviço..." value={busca} onChange={e=>setBusca(e.target.value)} />
        <button style={s.btnPrimary} onClick={()=>setModal(true)}>+ Nova OS</button>
      </div>

      {/* STATS */}
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
              <td style={s.td}><div style={{fontSize:12}}><div style={{fontWeight:500}}>{os.produto||'—'}</div><div style={{color:'#888'}}>{os.servico}</div></div></td>
              <td style={s.td}>{fmt(os.valor)}</td>
              <td style={s.td}>{os.data_entrada ? new Date(os.data_entrada+'T12:00').toLocaleDateString('pt-BR') : '—'}</td>
              <td style={s.td}>{os.usuarios?.nome||'—'}</td>
              <td style={s.td}><Badge s={os.status}/></td>
              <td style={s.td}>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {os.status!=='concluida' && os.status!=='cancelada' && (
                    <button style={{...s.btnSm,background:'#1D9E75',color:'#fff',border:'none'}} onClick={()=>atualizarStatus(os.id,'concluida')}>✓ Concluir</button>
                  )}
                  <button style={s.btnSm} onClick={()=>router.push(`/recibo?os=${os.id}`)}>🧾 Recibo</button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {filtradas.length===0 && <div style={{padding:24,textAlign:'center',color:'#aaa',fontSize:13}}>Nenhuma OS encontrada.</div>}
      </div>

      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.mHead}><span>Nova Ordem de Serviço</span><button style={s.xBtn} onClick={()=>{setModal(false);resetForm()}}>×</button></div>
            
            <div style={s.section}>CLIENTE</div>
            <div style={s.fg}><label style={s.label}>Selecionar cliente cadastrado</label>
              <select style={s.input} onChange={e=>selecionarCliente(e.target.value)}>
                <option value="">— Selecione ou preencha manualmente —</option>
                {clientes.map(c=><option key={c.id} value={c.id}>{c.nome} · {c.telefone}</option>)}
              </select>
            </div>
            <div style={s.row2}>
              <FG label="Nome do cliente" value={form.cliente_nome} onChange={v=>setForm({...form,cliente_nome:v})} />
              <FG label="Telefone" value={form.cliente_telefone} onChange={v=>setForm({...form,cliente_telefone:v})} />
            </div>
            <FG label="Endereço" value={form.cliente_endereco} onChange={v=>setForm({...form,cliente_endereco:v})} />

            <div style={s.section}>SERVIÇO</div>
            <div style={s.row2}>
              <FG label="Produto / Equipamento" value={form.produto} onChange={v=>setForm({...form,produto:v})} placeholder="Ex: Geladeira Brastemp" />
              <FG label="Servico realizado" value={form.servico} onChange={v=>setForm({...form,servico:v})} placeholder="Ex: Troca de compressor" />
            </div>
            <FG label="Descrição / Diagnóstico" value={form.descricao} onChange={v=>setForm({...form,descricao:v})} textarea placeholder="Descreva o problema e o que foi feito..." />
            <div style={s.row2}>
              <FG label="Valor (R$)" value={form.valor} onChange={v=>setForm({...form,valor:v})} type="number" />
              <div style={s.fg}><label style={s.label}>Status</label>
                <select style={s.input} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  <option value="aberta">Aberta</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluida">Concluída</option>
                </select>
              </div>
            </div>
            <div style={s.row2}>
              <FG label="Data de entrada *" value={form.data_entrada} onChange={v=>setForm({...form,data_entrada:v})} type="date" />
              <FG label="Data de conclusão" value={form.data_conclusao} onChange={v=>setForm({...form,data_conclusao:v})} type="date" />
            </div>
            <div style={s.fg}><label style={s.label}>Técnico responsável</label>
              <select style={s.input} value={form.tecnico_id} onChange={e=>setForm({...form,tecnico_id:e.target.value})}>
                <option value="">Selecione...</option>
                {tecnicos.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
            <FG label="Observações" value={form.observacoes} onChange={v=>setForm({...form,observacoes:v})} textarea />
            <div style={s.btnRow}>
              <button style={s.btnSecondary} onClick={()=>{setModal(false);resetForm()}}>Cancelar</button>
              <button style={s.btnPrimary} onClick={salvar}>Salvar OS</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

function FG({label,value,onChange,type='text',textarea,placeholder}){
  const inp={width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:13,fontFamily:'inherit',minHeight:textarea?70:undefined,resize:textarea?'vertical':undefined}
  return <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,color:'#888',fontWeight:500,marginBottom:3}}>{label}</label>{textarea?<textarea style={inp} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>:<input style={inp} type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>}</div>
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
  section:{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'#aaa',margin:'16px 0 8px',paddingBottom:6,borderBottom:'1px solid #f0f0f0'},
  fg:{marginBottom:12},
  label:{display:'block',fontSize:11,color:'#888',fontWeight:500,marginBottom:3},
  input:{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:13,fontFamily:'inherit'},
  row2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12},
  btnRow:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16},
}
