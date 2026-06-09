import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import Link from 'next/link'

function useIsMobile(){ const [m,setM]=useState(false); useEffect(()=>{const c=()=>setM(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);return m }
const badgeColors={em_andamento:['#FAEEDA','#854F0B'],concluido:['#EAF3DE','#3B6D11'],concluida:['#EAF3DE','#3B6D11']}
function Badge({s}){const[bg,c]=badgeColors[s]||['#F1EFE8','#5F5E5A'];return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{(s||'').replace('_',' ')}</span>}

const CARDS_DEFAULT = [
  {id:'faturamento', label:'Faturamento', ativo:true, tamanho:'medio'},
  {id:'despesas', label:'Despesas', ativo:true, tamanho:'medio'},
  {id:'lucro', label:'Lucro', ativo:true, tamanho:'medio'},
  {id:'ticket', label:'Ticket médio', ativo:true, tamanho:'medio'},
  {id:'clientes', label:'Clientes ativos', ativo:true, tamanho:'pequeno'},
  {id:'andamento', label:'Em andamento', ativo:true, tamanho:'pequeno'},
  {id:'concluidas', label:'Concluídas', ativo:true, tamanho:'pequeno'},
  {id:'hoje', label:'Agendamentos hoje', ativo:true, tamanho:'pequeno'},
  {id:'grafico', label:'Receita por mês', ativo:true, tamanho:'largo'},
  {id:'agendamentos', label:'Próximos agendamentos', ativo:true, tamanho:'largo'},
]

function loadConfig() {
  try { return JSON.parse(localStorage.getItem('dashboard_config')) || CARDS_DEFAULT }
  catch { return CARDS_DEFAULT }
}
function saveConfig(cfg) { localStorage.setItem('dashboard_config', JSON.stringify(cfg)) }

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [agendamentos, setAgendamentos] = useState([])
  const [stats, setStats] = useState({clientes:0,hoje:0,andamento:0,concluidas:0,fat:0,desp:0,meses:[]})
  const [editando, setEditando] = useState(false)
  const [config, setConfig] = useState(CARDS_DEFAULT)
  const [configEdit, setConfigEdit] = useState(CARDS_DEFAULT)
  const { t } = useTheme()
  const isMobile = useIsMobile()

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    setUser(u); loadData(u)
    const cfg = loadConfig()
    setConfig(cfg); setConfigEdit(cfg)
  },[])

  async function loadData(u) {
    const hoje = new Date().toISOString().split('T')[0]
    if(u.role==='gestor'){
      const [{count:clientes},{data:ag},{data:os},{data:desp}] = await Promise.all([
        supabase.from('clientes').select('*',{count:'exact',head:true}).eq('ativo',true),
        supabase.from('agendamentos').select('*, clientes(nome), usuarios(nome)').order('data').order('hora').limit(8),
        supabase.from('ordens_servico').select('valor,status,data_conclusao,data_entrada'),
        supabase.from('despesas').select('valor'),
      ])
      const concl=(os||[]).filter(o=>o.status==='concluida')
      const fat=concl.reduce((s,o)=>s+Number(o.valor||0),0)
      const desptot=(desp||[]).reduce((s,d)=>s+Number(d.valor||0),0)
      const andamento=(os||[]).filter(o=>o.status==='em_andamento').length
      const hojeCount=(ag||[]).filter(a=>a.data===hoje).length
      const porMesMap={}
      concl.forEach(o=>{const m=(o.data_conclusao||o.data_entrada)?.slice(0,7);if(m)porMesMap[m]=(porMesMap[m]||0)+Number(o.valor||0)})
      setStats({clientes:clientes||0,hoje:hojeCount,andamento,concluidas:concl.length,fat,desp:desptot,meses:Object.entries(porMesMap).sort().slice(-6)})
      setAgendamentos(ag||[])
    } else {
      const{data:ag}=await supabase.from('agendamentos').select('*, clientes(nome)').eq('funcionario_id',u.id).order('data').limit(10)
      setAgendamentos(ag||[])
    }
  }

  function salvarConfig() {
    setConfig(configEdit); saveConfig(configEdit); setEditando(false)
  }
  function toggleAtivo(id){ setConfigEdit(c=>c.map(x=>x.id===id?{...x,ativo:!x.ativo}:x)) }
  function setTamanho(id,tam){ setConfigEdit(c=>c.map(x=>x.id===id?{...x,tamanho:tam}:x)) }
  function moverCima(idx){ if(idx===0) return; const c=[...configEdit]; [c[idx-1],c[idx]]=[c[idx],c[idx-1]]; setConfigEdit(c) }
  function moverBaixo(idx){ if(idx===configEdit.length-1) return; const c=[...configEdit]; [c[idx],c[idx+1]]=[c[idx+1],c[idx]]; setConfigEdit(c) }

  if(!user) return null
  const isGestor=user.role==='gestor'
  const fmt=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const lucro=stats.fat-stats.desp
  const ticket=stats.concluidas?stats.fat/stats.concluidas:0
  const maxVal=Math.max(...(stats.meses||[]).map(([,v])=>v),1)

  const colSpan = (tam) => {
    if(isMobile) return '1 / -1'
    if(tam==='largo') return '1 / -1'
    if(tam==='medio') return 'span 2'
    return 'span 1'
  }

  const cardStyle = (tam) => ({
    background:t.bgCard, border:'1px solid '+t.border, borderRadius:12,
    padding:'16px 18px', gridColumn:colSpan(tam)
  })

  const cardData = {
    faturamento: { label:'Faturamento', value:fmt(stats.fat), sub:'OS concluídas', color:null },
    despesas: { label:'Despesas', value:fmt(stats.desp), sub:'gastos da empresa', color:'#A32D2D' },
    lucro: { label:'Lucro', value:fmt(lucro), sub:'fat − despesas', color:lucro>=0?t.accent:'#A32D2D', highlight:true },
    ticket: { label:'Ticket médio', value:fmt(ticket), sub:'por serviço', color:null },
    clientes: { label:'Clientes ativos', value:stats.clientes, sub:null, color:null },
    andamento: { label:'Em andamento', value:stats.andamento, sub:null, color:'#854F0B' },
    concluidas: { label:'Concluídas', value:stats.concluidas, sub:null, color:'#3B6D11' },
    hoje: { label:'Agenda hoje', value:stats.hoje, sub:null, color:null },
  }

  const gridCols = isMobile ? '1fr' : 'repeat(4,1fr)'

  return (
    <Layout title={isGestor?'Dashboard':'Meus Serviços'}>
      {isGestor ? (
        <>
          {/* BOTÃO EDITAR */}
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
            <button style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:8,border:'1px solid '+t.border,background:editando?t.accent:t.bgCard,color:editando?'#fff':t.text,fontSize:12,cursor:'pointer',fontWeight:500}} onClick={()=>{setEditando(!editando);setConfigEdit(config)}}>
              {editando ? '× Fechar edição' : '⊞ Editar dashboard'}
            </button>
          </div>

          {/* PAINEL DE EDIÇÃO */}
          {editando && (
            <div style={{background:t.bgCard,border:'1px solid '+t.accent,borderRadius:12,padding:20,marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:600,color:t.text,marginBottom:4}}>Personalizar dashboard</div>
              <div style={{fontSize:12,color:t.textSoft,marginBottom:16}}>Ative, desative, mude o tamanho e reordene os blocos.</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {configEdit.map((card,idx)=>(
                  <div key={card.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,background:t.bgSidebar,border:'1px solid '+(card.ativo?t.border:t.borderSoft),opacity:card.ativo?1:0.5}}>
                    {/* ordem */}
                    <div style={{display:'flex',flexDirection:'column',gap:2}}>
                      <button onClick={()=>moverCima(idx)} style={{background:'none',border:'none',cursor:'pointer',color:t.textSoft,fontSize:14,padding:'0 4px',lineHeight:1}}>▲</button>
                      <button onClick={()=>moverBaixo(idx)} style={{background:'none',border:'none',cursor:'pointer',color:t.textSoft,fontSize:14,padding:'0 4px',lineHeight:1}}>▼</button>
                    </div>
                    {/* toggle ativo */}
                    <div onClick={()=>toggleAtivo(card.id)} style={{width:36,height:20,borderRadius:10,background:card.ativo?t.accent:t.borderSoft,cursor:'pointer',position:'relative',flexShrink:0}}>
                      <div style={{position:'absolute',top:2,left:card.ativo?18:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .15s'}}/>
                    </div>
                    {/* label */}
                    <span style={{flex:1,fontSize:13,color:t.text,fontWeight:500}}>{card.label}</span>
                    {/* tamanho */}
                    <div style={{display:'flex',gap:4}}>
                      {['pequeno','medio','largo'].map(tam=>(
                        <button key={tam} onClick={()=>setTamanho(card.id,tam)} style={{padding:'3px 8px',borderRadius:6,border:'1px solid '+(card.tamanho===tam?t.accent:t.border),background:card.tamanho===tam?t.accentSoft:'transparent',color:card.tamanho===tam?t.accentDark:t.textSoft,fontSize:11,cursor:'pointer',fontWeight:card.tamanho===tam?600:400}}>
                          {tam==='pequeno'?'P':tam==='medio'?'M':'L'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
                <button style={{padding:'8px 16px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:13,cursor:'pointer'}} onClick={()=>{setConfigEdit(CARDS_DEFAULT)}}>Resetar</button>
                <button style={{padding:'8px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500}} onClick={salvarConfig}>Salvar layout</button>
              </div>
            </div>
          )}

          {/* CARDS RENDERIZADOS CONFORME CONFIG */}
          <div style={{display:'grid',gridTemplateColumns:gridCols,gap:12,marginBottom:16}}>
            {config.filter(c=>c.ativo && cardData[c.id]).map(card=>{
              const d=cardData[card.id]
              return (
                <div key={card.id} style={{...cardStyle(card.tamanho),border:d.highlight?'1px solid '+t.accent:'1px solid '+t.border}}>
                  <div style={{fontSize:12,color:t.textSoft,marginBottom:6}}>{d.label}</div>
                  <div style={{fontSize:isMobile?20:card.tamanho==='pequeno'?18:24,fontWeight:700,color:d.color||t.text}}>{d.value}</div>
                  {d.sub&&<div style={{fontSize:11,color:t.textSoft,marginTop:4}}>{d.sub}</div>}
                </div>
              )
            })}
          </div>

          {/* GRÁFICO */}
          {config.find(c=>c.id==='grafico'&&c.ativo) && (
            <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,overflow:'hidden',marginBottom:16}}>
              <div style={{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:14,fontWeight:600,color:t.text}}>Receita por mês</span>
                <Link href="/faturamento" style={{fontSize:11,padding:'5px 12px',borderRadius:8,border:'1px solid '+t.border,color:t.text,background:t.bgSidebar}}>Ver tudo</Link>
              </div>
              <div style={{padding:'16px 18px'}}>
                {stats.meses.length===0&&<div style={{fontSize:13,color:t.textSoft}}>Sem dados ainda.</div>}
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {stats.meses.map(([mes,val])=>{
                    const nomeMes=new Date(mes+'-01').toLocaleDateString('pt-BR',{month:'short',year:'2-digit'})
                    return(
                      <div key={mes} style={{display:'flex',alignItems:'center',gap:12,fontSize:12}}>
                        <span style={{width:60,color:t.textSoft,flexShrink:0,textTransform:'capitalize'}}>{nomeMes}</span>
                        <div style={{flex:1,height:12,background:t.bgSidebar,borderRadius:99,overflow:'hidden'}}>
                          <div style={{height:'100%',background:t.accent,borderRadius:99,width:Math.round(val/maxVal*100)+'%',transition:'width .4s'}}/>
                        </div>
                        <span style={{width:90,textAlign:'right',fontWeight:600,color:t.text,fontSize:isMobile?11:12}}>{fmt(val)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* AGENDAMENTOS */}
          {config.find(c=>c.id==='agendamentos'&&c.ativo) && (
            <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,overflow:'hidden',marginBottom:16}}>
              <div style={{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:14,fontWeight:600,color:t.text}}>Próximos agendamentos</span>
                <Link href="/agendamentos" style={{fontSize:11,padding:'5px 12px',borderRadius:8,border:'1px solid '+t.border,color:t.text,background:t.bgSidebar}}>Ver todos</Link>
              </div>
              {isMobile?(
                <div style={{padding:'8px 14px'}}>
                  {agendamentos.map(a=>(
                    <div key={a.id} style={{padding:'10px 0',borderBottom:'1px solid '+t.borderSoft}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontWeight:500,color:t.text,fontSize:13}}>{a.cliente_nome||a.clientes?.nome||'—'}</span>
                        <Badge s={a.status}/>
                      </div>
                      <div style={{fontSize:12,color:t.textSoft,marginTop:2}}>{a.servico} · {new Date(a.data+'T12:00').toLocaleDateString('pt-BR')}</div>
                    </div>
                  ))}
                  {agendamentos.length===0&&<div style={{padding:16,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhum agendamento.</div>}
                </div>
              ):(
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr>{['Cliente','Serviço','Data','Funcionário','Status'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 14px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft}}>{h}</th>)}</tr></thead>
                  <tbody>{agendamentos.map(a=>(
                    <tr key={a.id}>
                      <td style={{padding:'10px 14px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{a.cliente_nome||a.clientes?.nome||'—'}</td>
                      <td style={{padding:'10px 14px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{a.servico}</td>
                      <td style={{padding:'10px 14px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{new Date(a.data+'T12:00').toLocaleDateString('pt-BR')}</td>
                      <td style={{padding:'10px 14px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{a.usuarios?.nome||<span style={{color:t.textSoft,fontStyle:'italic'}}>—</span>}</td>
                      <td style={{padding:'10px 14px',borderBottom:'1px solid '+t.borderSoft}}><Badge s={a.status}/></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          )}
        </>
      ):(
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
            {[['Hoje',agendamentos.filter(a=>a.data===new Date().toISOString().split('T')[0]).length],['Próximos',agendamentos.filter(a=>a.data>new Date().toISOString().split('T')[0]).length],['Total',agendamentos.length]].map(([l,v])=>(
              <div key={l} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:'12px 14px'}}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>{l}</div><div style={{fontSize:20,fontWeight:700,color:t.text}}>{v}</div></div>
            ))}
          </div>
          <div style={{marginBottom:10,fontSize:13,fontWeight:500,color:t.textSoft}}>Seus agendamentos</div>
          {agendamentos.map(a=>(
            <div key={a.id} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'12px 14px',marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                <div style={{fontSize:15,fontWeight:500,color:t.text}}>{a.cliente_nome||a.clientes?.nome}</div>
                <div style={{fontSize:20,fontWeight:700,color:t.accent}}>{a.hora?.slice(0,5)}</div>
              </div>
              <div style={{fontSize:12,color:t.textSoft,marginBottom:6}}>{a.servico} · {new Date(a.data+'T12:00').toLocaleDateString('pt-BR')}</div>
              <Badge s={a.status}/>
            </div>
          ))}
          {agendamentos.length===0&&<div style={{fontSize:13,color:t.textSoft,padding:16,textAlign:'center'}}>Nenhum agendamento.</div>}
        </>
      )}
    </Layout>
  )
}
