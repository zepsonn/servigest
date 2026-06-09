import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import Link from 'next/link'

function useIsMobile(){ const [m,setM]=useState(false); useEffect(()=>{const c=()=>setM(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);return m }
const badgeColors={em_andamento:['#FAEEDA','#854F0B'],concluido:['#EAF3DE','#3B6D11'],concluida:['#EAF3DE','#3B6D11']}
function Badge({s}){const[bg,c]=badgeColors[s]||['#F1EFE8','#5F5E5A'];return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{(s||'').replace('_',' ')}</span>}

const CARDS_DEFAULT = [
  {id:'faturamento',label:'Faturamento',tamanho:'medio'},
  {id:'despesas',label:'Despesas',tamanho:'medio'},
  {id:'lucro',label:'Lucro',tamanho:'medio'},
  {id:'ticket',label:'Ticket médio',tamanho:'medio'},
  {id:'clientes',label:'Clientes ativos',tamanho:'pequeno'},
  {id:'andamento',label:'Em andamento',tamanho:'pequeno'},
  {id:'concluidas',label:'Concluídas',tamanho:'pequeno'},
  {id:'hoje',label:'Agenda hoje',tamanho:'pequeno'},
  {id:'grafico',label:'Receita por mês',tamanho:'largo'},
  {id:'agendamentos',label:'Próximos agendamentos',tamanho:'largo'},
]
const TODOS_CARDS = CARDS_DEFAULT

function loadConfig(){
  try{ const c=JSON.parse(localStorage.getItem('db_cfg2')); return c&&c.length?c:CARDS_DEFAULT }
  catch{ return CARDS_DEFAULT }
}
function saveConfig(c){ localStorage.setItem('db_cfg2',JSON.stringify(c)) }

export default function Dashboard(){
  const [user,setUser]=useState(null)
  const [ag,setAg]=useState([])
  const [stats,setStats]=useState({clientes:0,hoje:0,andamento:0,concluidas:0,fat:0,desp:0,meses:[]})
  const [editando,setEditando]=useState(false)
  const [config,setConfig]=useState(CARDS_DEFAULT)
  const [draft,setDraft]=useState(CARDS_DEFAULT)
  const [dragIdx,setDragIdx]=useState(null)
  const [overIdx,setOverIdx]=useState(null)
  const {t}=useTheme()
  const isMobile=useIsMobile()

  useEffect(()=>{
    const u=JSON.parse(localStorage.getItem('servigest_user')||'{}')
    setUser(u); loadData(u)
    const c=loadConfig(); setConfig(c); setDraft([...c])
  },[])

  async function loadData(u){
    const hoje=new Date().toISOString().split('T')[0]
    if(u.role==='gestor'){
      const [{count:cl},{data:ags},{data:os},{data:desp}]=await Promise.all([
        supabase.from('clientes').select('*',{count:'exact',head:true}).eq('ativo',true),
        supabase.from('agendamentos').select('*, clientes(nome), usuarios(nome)').order('data').order('hora').limit(8),
        supabase.from('ordens_servico').select('valor,status,data_conclusao,data_entrada'),
        supabase.from('despesas').select('valor'),
      ])
      const concl=(os||[]).filter(o=>o.status==='concluida')
      const fat=concl.reduce((s,o)=>s+Number(o.valor||0),0)
      const desp2=(desp||[]).reduce((s,d)=>s+Number(d.valor||0),0)
      const andamento=(os||[]).filter(o=>o.status==='em_andamento').length
      const hojeCount=(ags||[]).filter(a=>a.data===hoje).length
      const pm={}; concl.forEach(o=>{const m=(o.data_conclusao||o.data_entrada)?.slice(0,7);if(m)pm[m]=(pm[m]||0)+Number(o.valor||0)})
      setStats({clientes:cl||0,hoje:hojeCount,andamento,concluidas:concl.length,fat,desp:desp2,meses:Object.entries(pm).sort().slice(-6)})
      setAg(ags||[])
    } else {
      const{data:ags}=await supabase.from('agendamentos').select('*, clientes(nome)').eq('funcionario_id',u.id).order('data').limit(10)
      setAg(ags||[])
    }
  }

  // drag sobre a grade
  function dgStart(i){setDragIdx(i)}
  function dgOver(e,i){e.preventDefault();setOverIdx(i)}
  function dgDrop(e,i){
    e.preventDefault()
    if(dragIdx===null||dragIdx===i){setDragIdx(null);setOverIdx(null);return}
    const arr=[...draft]; const item=arr.splice(dragIdx,1)[0]; arr.splice(i,0,item)
    setDraft(arr); setDragIdx(null); setOverIdx(null)
  }
  function dgEnd(){setDragIdx(null);setOverIdx(null)}
  function remover(id){setDraft(d=>d.filter(c=>c.id!==id))}
  function adicionar(card){setDraft(d=>[...d,{...card}])}
  function setTam(id,tam){setDraft(d=>d.map(c=>c.id===id?{...c,tamanho:tam}:c))}
  function salvar(){setConfig(draft);saveConfig(draft);setEditando(false)}
  function cancelar(){setDraft([...config]);setEditando(false)}
  function resetar(){setDraft([...CARDS_DEFAULT])}

  if(!user) return null
  const isGestor=user.role==='gestor'
  const fmt=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const lucro=stats.fat-stats.desp
  const ticket=stats.concluidas?stats.fat/stats.concluidas:0
  const maxVal=Math.max(...stats.meses.map(([,v])=>v),1)

  const ausentes=TODOS_CARDS.filter(c=>!draft.find(d=>d.id===c.id))

  const cardVal={
    faturamento:{v:fmt(stats.fat),sub:'OS concluídas',c:null,hl:false},
    despesas:{v:fmt(stats.desp),sub:'gastos da empresa',c:'#A32D2D',hl:false},
    lucro:{v:fmt(lucro),sub:'fat − despesas',c:lucro>=0?t.accent:'#A32D2D',hl:true},
    ticket:{v:fmt(ticket),sub:'por serviço',c:null,hl:false},
    clientes:{v:stats.clientes,sub:null,c:null,hl:false},
    andamento:{v:stats.andamento,sub:null,c:'#854F0B',hl:false},
    concluidas:{v:stats.concluidas,sub:null,c:'#3B6D11',hl:false},
    hoje:{v:stats.hoje,sub:null,c:null,hl:false},
  }

  const colSpan=tam=>{ if(isMobile)return'1/-1'; if(tam==='largo')return'1/-1'; if(tam==='medio')return'span 2'; return'span 1' }

  const renderCard=(card,idx,edit)=>{
    const d=cardVal[card.id]
    const isDragging=edit&&dragIdx===idx
    const isOver=edit&&overIdx===idx&&dragIdx!==idx

    if(card.id==='grafico'||card.id==='agendamentos'){
      return (
        <div key={card.id}
          draggable={edit}
          onDragStart={edit?()=>dgStart(idx):undefined}
          onDragOver={edit?e=>dgOver(e,idx):undefined}
          onDrop={edit?e=>dgDrop(e,idx):undefined}
          onDragEnd={edit?dgEnd:undefined}
          style={{background:t.bgCard,border:'1px solid '+(isOver?t.accent:t.border),borderRadius:12,overflow:'hidden',marginBottom:0,gridColumn:colSpan(card.tamanho),opacity:isDragging?0.4:1,position:'relative',cursor:edit?'grab':'default'}}>
          {edit&&<EditOverlay card={card} idx={idx} t={t} onRemove={()=>remover(card.id)} onTam={tam=>setTam(card.id,tam)}/>}
          {card.id==='grafico'&&(
            <>
              <div style={{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:14,fontWeight:600,color:t.text}}>Receita por mês</span>
                {!edit&&<Link href="/faturamento" style={{fontSize:11,padding:'5px 10px',borderRadius:8,border:'1px solid '+t.border,color:t.text,background:t.bgSidebar}}>Ver tudo</Link>}
              </div>
              <div style={{padding:'16px 18px'}}>
                {stats.meses.length===0&&<div style={{fontSize:13,color:t.textSoft}}>Sem dados ainda.</div>}
                {stats.meses.map(([mes,val])=>{
                  const nm=new Date(mes+'-01').toLocaleDateString('pt-BR',{month:'short',year:'2-digit'})
                  return <div key={mes} style={{display:'flex',alignItems:'center',gap:10,fontSize:12,marginBottom:10}}>
                    <span style={{width:55,color:t.textSoft,flexShrink:0,textTransform:'capitalize'}}>{nm}</span>
                    <div style={{flex:1,height:12,background:t.bgSidebar,borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',background:t.accent,borderRadius:99,width:Math.round(val/maxVal*100)+'%'}}/></div>
                    <span style={{width:85,textAlign:'right',fontWeight:600,color:t.text,fontSize:11}}>{fmt(val)}</span>
                  </div>
                })}
              </div>
            </>
          )}
          {card.id==='agendamentos'&&(
            <>
              <div style={{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:14,fontWeight:600,color:t.text}}>Próximos agendamentos</span>
                {!edit&&<Link href="/agendamentos" style={{fontSize:11,padding:'5px 10px',borderRadius:8,border:'1px solid '+t.border,color:t.text,background:t.bgSidebar}}>Ver todos</Link>}
              </div>
              {isMobile?(
                <div style={{padding:'8px 14px'}}>
                  {ag.map(a=><div key={a.id} style={{padding:'8px 0',borderBottom:'1px solid '+t.borderSoft}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:500,color:t.text,fontSize:13}}>{a.cliente_nome||a.clientes?.nome||'—'}</span><Badge s={a.status}/></div>
                    <div style={{fontSize:12,color:t.textSoft}}>{a.servico} · {new Date(a.data+'T12:00').toLocaleDateString('pt-BR')}</div>
                  </div>)}
                  {ag.length===0&&<div style={{padding:16,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhum.</div>}
                </div>
              ):(
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr>{['Cliente','Serviço','Data','Funcionário','Status'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 14px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft}}>{h}</th>)}</tr></thead>
                  <tbody>{ag.map(a=><tr key={a.id}>
                    <td style={{padding:'9px 14px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{a.cliente_nome||a.clientes?.nome||'—'}</td>
                    <td style={{padding:'9px 14px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{a.servico}</td>
                    <td style={{padding:'9px 14px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{new Date(a.data+'T12:00').toLocaleDateString('pt-BR')}</td>
                    <td style={{padding:'9px 14px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{a.usuarios?.nome||'—'}</td>
                    <td style={{padding:'9px 14px',borderBottom:'1px solid '+t.borderSoft}}><Badge s={a.status}/></td>
                  </tr>)}</tbody>
                </table>
              )}
            </>
          )}
        </div>
      )
    }

    // card simples
    if(!d) return null
    return (
      <div key={card.id}
        draggable={edit}
        onDragStart={edit?()=>dgStart(idx):undefined}
        onDragOver={edit?e=>dgOver(e,idx):undefined}
        onDrop={edit?e=>dgDrop(e,idx):undefined}
        onDragEnd={edit?dgEnd:undefined}
        style={{background:t.bgCard,border:'1px solid '+(isOver?t.accent:d.hl?t.accent:t.border),borderRadius:12,padding:'16px 18px',gridColumn:colSpan(card.tamanho),opacity:isDragging?0.4:1,position:'relative',cursor:edit?'grab':'default'}}>
        {edit&&<EditOverlay card={card} idx={idx} t={t} onRemove={()=>remover(card.id)} onTam={tam=>setTam(card.id,tam)}/>}
        <div style={{fontSize:12,color:t.textSoft,marginBottom:6}}>{card.label}</div>
        <div style={{fontSize:isMobile?18:card.tamanho==='pequeno'?18:24,fontWeight:700,color:d.c||t.text}}>{d.v}</div>
        {d.sub&&<div style={{fontSize:11,color:t.textSoft,marginTop:4}}>{d.sub}</div>}
      </div>
    )
  }

  return (
    <Layout title={isGestor?'Dashboard':'Meus Serviços'}>
      {isGestor?(
        <>
          {/* BARRA DE EDIÇÃO */}
          {editando?(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:t.bgCard,border:'1px solid '+t.accent,borderRadius:10,padding:'10px 16px',marginBottom:16}}>
              <div style={{fontSize:13,color:t.text,fontWeight:500}}>Modo edição — arraste os cards para reorganizar</div>
              <div style={{display:'flex',gap:8}}>
                <button style={{padding:'6px 12px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:12,cursor:'pointer'}} onClick={resetar}>Resetar</button>
                <button style={{padding:'6px 12px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:12,cursor:'pointer'}} onClick={cancelar}>Cancelar</button>
                <button style={{padding:'6px 14px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:600}} onClick={salvar}>Salvar</button>
              </div>
            </div>
          ):(
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
              <button style={{padding:'6px 14px',borderRadius:8,border:'1px solid '+t.border,background:t.bgCard,color:t.text,fontSize:12,cursor:'pointer',fontWeight:500,display:'flex',alignItems:'center',gap:6}} onClick={()=>setEditando(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar dashboard
              </button>
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(4,1fr)',gap:12,marginBottom:16}}>
            {(editando?draft:config).map((card,idx)=>renderCard(card,idx,editando))}
            {/* zona de drop vazia quando editando */}
            {editando&&(
              <div onDragOver={e=>{e.preventDefault();setOverIdx(draft.length)}} onDrop={e=>{e.preventDefault();if(dragIdx!==null){const arr=[...draft];const item=arr.splice(dragIdx,1)[0];arr.push(item);setDraft(arr);setDragIdx(null);setOverIdx(null)}}} style={{border:'2px dashed '+t.borderSoft,borderRadius:12,minHeight:60,gridColumn:'1/-1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:t.textSoft}}>
                Solte aqui para mover para o final
              </div>
            )}
          </div>

          {/* CARDS REMOVIDOS — podem ser readicionados */}
          {editando&&ausentes.length>0&&(
            <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:16,marginTop:8}}>
              <div style={{fontSize:12,color:t.textSoft,fontWeight:600,marginBottom:10,textTransform:'uppercase',letterSpacing:'.05em'}}>Cards removidos — clique para adicionar</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {ausentes.map(c=>(
                  <button key={c.id} onClick={()=>adicionar(c)} style={{padding:'6px 14px',borderRadius:8,border:'1px solid '+t.border,background:t.bgSidebar,color:t.text,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                    <span style={{color:t.accent,fontWeight:700}}>+</span> {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ):(
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
            {[['Hoje',ag.filter(a=>a.data===new Date().toISOString().split('T')[0]).length],['Próximos',ag.filter(a=>a.data>new Date().toISOString().split('T')[0]).length],['Total',ag.length]].map(([l,v])=>(
              <div key={l} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:'12px 14px'}}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>{l}</div><div style={{fontSize:20,fontWeight:700,color:t.text}}>{v}</div></div>
            ))}
          </div>
          {ag.map(a=>(
            <div key={a.id} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'12px 14px',marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <div style={{fontSize:15,fontWeight:500,color:t.text}}>{a.cliente_nome||a.clientes?.nome}</div>
                <Badge s={a.status}/>
              </div>
              <div style={{fontSize:12,color:t.textSoft}}>{a.servico} · {new Date(a.data+'T12:00').toLocaleDateString('pt-BR')}</div>
            </div>
          ))}
          {ag.length===0&&<div style={{fontSize:13,color:t.textSoft,padding:16,textAlign:'center'}}>Nenhum agendamento.</div>}
        </>
      )}
    </Layout>
  )
}

function EditOverlay({card,t,onRemove,onTam}){
  return (
    <div style={{position:'absolute',top:6,right:6,display:'flex',gap:4,zIndex:10}} onDragStart={e=>e.stopPropagation()}>
      {['pequeno','medio','largo'].map(tam=>(
        <button key={tam} onClick={()=>onTam(tam)} style={{padding:'2px 6px',borderRadius:4,border:'1px solid '+(card.tamanho===tam?t.accent:t.border),background:card.tamanho===tam?t.accentSoft:t.bgCard,color:card.tamanho===tam?t.accentDark:t.textSoft,fontSize:10,cursor:'pointer',fontWeight:card.tamanho===tam?700:400}}>
          {tam==='pequeno'?'P':tam==='medio'?'M':'L'}
        </button>
      ))}
      <button onClick={onRemove} style={{padding:'2px 6px',borderRadius:4,border:'1px solid #FCEBEB',background:'#FCEBEB',color:'#A32D2D',fontSize:12,cursor:'pointer',fontWeight:700,lineHeight:1}}>×</button>
    </div>
  )
}
