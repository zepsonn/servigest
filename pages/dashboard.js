import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import Link from 'next/link'

function useIsMobile(){ const [m,setM]=useState(false); useEffect(()=>{const c=()=>setM(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);return m }
const badgeColors={em_andamento:['#FAEEDA','#854F0B'],concluido:['#EAF3DE','#3B6D11'],concluida:['#EAF3DE','#3B6D11']}
function Badge({s}){const[bg,c]=badgeColors[s]||['#F1EFE8','#5F5E5A'];return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{(s||'').replace('_',' ')}</span>}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [agendamentos, setAgendamentos] = useState([])
  const [stats, setStats] = useState({clientes:0,hoje:0,andamento:0,concluidas:0,fat:0,desp:0,meses:[]})
  const { t } = useTheme()
  const isMobile = useIsMobile()

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    setUser(u); loadData(u)
  },[])

  async function loadData(u) {
    const hoje = new Date().toISOString().split('T')[0]
    if(u.role==='gestor'){
      const [{count:clientes},{data:ag},{data:os},{data:desp}] = await Promise.all([
        supabase.from('clientes').select('*',{count:'exact',head:true}).eq('ativo',true),
        supabase.from('agendamentos').select('*, clientes(nome), usuarios(nome)').order('data').order('hora').limit(6),
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
      const meses=Object.entries(porMesMap).sort().slice(-6)
      setStats({clientes:clientes||0,hoje:hojeCount,andamento,concluidas:concl.length,fat,desp:desptot,meses})
      setAgendamentos(ag||[])
    } else {
      const{data:ag}=await supabase.from('agendamentos').select('*, clientes(nome)').eq('funcionario_id',u.id).order('data').limit(10)
      setAgendamentos(ag||[])
    }
  }

  if(!user) return null
  const isGestor = user.role==='gestor'
  const fmt = n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const lucro = stats.fat-stats.desp
  const ticket = stats.concluidas?stats.fat/stats.concluidas:0
  const maxVal = Math.max(...(stats.meses||[]).map(([,v])=>v),1)

  const s = {
    card:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,overflow:'hidden',marginBottom:16},
    cardHead:{padding:isMobile?'12px 14px':'14px 18px',borderBottom:'1px solid '+t.borderSoft,display:'flex',alignItems:'center',justifyContent:'space-between'},
    cardTitle:{fontSize:14,fontWeight:600,color:t.text},
    linkBtn:{fontSize:11,padding:'5px 12px',borderRadius:8,border:'1px solid '+t.border,color:t.text,background:t.bgSidebar},
    table:{width:'100%',borderCollapse:'collapse',fontSize:13},
    th:{textAlign:'left',padding:'8px 14px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft},
    td:{padding:'10px 14px',borderBottom:'1px solid '+t.borderSoft,color:t.text},
    smallStat:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:isMobile?'12px 14px':'14px 16px'},
    agCard:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'12px 14px',marginBottom:8},
  }

  return (
    <Layout title={isGestor?'Dashboard':'Meus Serviços'}>
      {isGestor?(
        <>
          {/* CARDS PRINCIPAIS */}
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:10,marginBottom:12}}>
            {[
              ['Faturamento',fmt(stats.fat),'OS concluídas',null],
              ['Despesas',fmt(stats.desp),'gastos da empresa','#A32D2D'],
              ['Lucro',fmt(lucro),'fat − despesas',lucro>=0?t.accent:'#A32D2D'],
              ['Ticket médio',fmt(ticket),'por serviço',null],
            ].map(([label,val,sub,color])=>(
              <div key={label} style={{...s.smallStat,border:label==='Lucro'?'1px solid '+t.accent:'1px solid '+t.border}}>
                <div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>{label}</div>
                <div style={{fontSize:isMobile?18:22,fontWeight:700,color:color||t.text}}>{val}</div>
                <div style={{fontSize:10,color:t.textSoft,marginTop:2}}>{sub}</div>
              </div>
            ))}
          </div>

          {/* CARDS SECUNDÁRIOS */}
          <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:10,marginBottom:14}}>
            {[['Clientes',stats.clientes,null],['Em andamento',stats.andamento,'#854F0B'],['Concluídas',stats.concluidas,'#3B6D11'],['Hoje',stats.hoje,null]].map(([l,v,c])=>(
              <div key={l} style={s.smallStat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>{l}</div><div style={{fontSize:isMobile?18:20,fontWeight:700,color:c||t.text}}>{v}</div></div>
            ))}
          </div>

          {/* GRÁFICO */}
          <div style={s.card}>
            <div style={s.cardHead}><span style={s.cardTitle}>Receita por mês</span><Link href="/faturamento" style={s.linkBtn}>Ver tudo</Link></div>
            <div style={{padding:isMobile?'12px 14px':'16px 18px'}}>
              {(stats.meses||[]).length===0&&<div style={{fontSize:13,color:t.textSoft}}>Sem dados ainda.</div>}
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {(stats.meses||[]).map(([mes,val])=>{
                  const nomeMes=new Date(mes+'-01').toLocaleDateString('pt-BR',{month:'short',year:'2-digit'})
                  return(
                    <div key={mes} style={{display:'flex',alignItems:'center',gap:10,fontSize:12}}>
                      <span style={{width:55,color:t.textSoft,flexShrink:0,textTransform:'capitalize'}}>{nomeMes}</span>
                      <div style={{flex:1,height:10,background:t.bgSidebar,borderRadius:99,overflow:'hidden'}}>
                        <div style={{height:'100%',background:t.accent,borderRadius:99,width:Math.round(val/maxVal*100)+'%'}}/>
                      </div>
                      <span style={{width:isMobile?80:100,textAlign:'right',fontWeight:600,color:t.text,fontSize:isMobile?11:12}}>{fmt(val)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* AGENDAMENTOS */}
          <div style={s.card}>
            <div style={s.cardHead}><span style={s.cardTitle}>Próximos agendamentos</span><Link href="/agendamentos" style={s.linkBtn}>Ver todos</Link></div>
            {isMobile?(
              <div style={{padding:'8px 14px'}}>
                {agendamentos.map(a=>(
                  <div key={a.id} style={s.agCard}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                      <div style={{fontWeight:500,color:t.text,fontSize:13}}>{a.cliente_nome||a.clientes?.nome||'—'}</div>
                      <Badge s={a.status}/>
                    </div>
                    <div style={{fontSize:12,color:t.textSoft}}>{a.servico} · {new Date(a.data+'T12:00').toLocaleDateString('pt-BR')} {a.hora?.slice(0,5)}</div>
                    {a.usuarios?.nome&&<div style={{fontSize:11,color:t.textSoft,marginTop:2}}>Técnico: {a.usuarios.nome}</div>}
                  </div>
                ))}
                {agendamentos.length===0&&<div style={{padding:16,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhum agendamento.</div>}
              </div>
            ):(
              <table style={s.table}>
                <thead><tr>{['Cliente','Serviço','Data/hora','Funcionário','Status'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>{agendamentos.map(a=>(
                  <tr key={a.id}>
                    <td style={s.td}>{a.cliente_nome||a.clientes?.nome||'—'}</td>
                    <td style={s.td}>{a.servico}</td>
                    <td style={s.td}>{new Date(a.data+'T12:00').toLocaleDateString('pt-BR')} {a.hora?.slice(0,5)}</td>
                    <td style={s.td}>{a.usuarios?.nome||<span style={{color:t.textSoft,fontStyle:'italic'}}>—</span>}</td>
                    <td style={s.td}><Badge s={a.status}/></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </>
      ):(
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
            {[['Hoje',agendamentos.filter(a=>a.data===new Date().toISOString().split('T')[0]).length],['Próximos',agendamentos.filter(a=>a.data>new Date().toISOString().split('T')[0]).length],['Total',agendamentos.length]].map(([l,v])=>(
              <div key={l} style={s.smallStat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>{l}</div><div style={{fontSize:20,fontWeight:700,color:t.text}}>{v}</div></div>
            ))}
          </div>
          <div style={{marginBottom:12,fontSize:13,fontWeight:500,color:t.textSoft}}>Seus agendamentos</div>
          {agendamentos.map(a=>(
            <div key={a.id} style={s.agCard}>
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
