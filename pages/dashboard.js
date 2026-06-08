import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import Link from 'next/link'

const badgeColors = {em_andamento:['#FAEEDA','#854F0B'],concluido:['#EAF3DE','#3B6D11'],concluida:['#EAF3DE','#3B6D11']}
function Badge({s}){ const [bg,c]=badgeColors[s]||['#F1EFE8','#5F5E5A']; return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{(s||'').replace('_',' ')}</span>}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [agendamentos, setAgendamentos] = useState([])
  const [stats, setStats] = useState({clientes:0,hoje:0,andamento:0,concluidas:0,fat:0,desp:0,meses:[]})
  const { t } = useTheme()

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('servigest_user') || '{}')
    setUser(u); loadData(u)
  }, [])

  async function loadData(u) {
    const hoje = new Date().toISOString().split('T')[0]
    if (u.role === 'gestor') {
      const [{ count: clientes }, { data: ag }, { data: os }, { data: desp }] = await Promise.all([
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('ativo', true),
        supabase.from('agendamentos').select('*, clientes(nome), usuarios(nome)').order('data').order('hora').limit(6),
        supabase.from('ordens_servico').select('valor, status, data_conclusao, data_entrada'),
        supabase.from('despesas').select('valor'),
      ])
      const concl = (os||[]).filter(o => o.status === 'concluida')
      const fat = concl.reduce((s,o) => s + Number(o.valor||0), 0)
      const desptot = (desp||[]).reduce((s,d)=>s+Number(d.valor||0),0)
      const andamento = (os||[]).filter(o => o.status === 'em_andamento').length
      const hojeCount = (ag||[]).filter(a => a.data === hoje).length

      // agrupar por mes corretamente (soma tudo do mesmo mes)
      const porMesMap = {}
      concl.forEach(o => {
        const m = (o.data_conclusao||o.data_entrada)?.slice(0,7)
        if (m) porMesMap[m] = (porMesMap[m]||0) + Number(o.valor||0)
      })
      const meses = Object.entries(porMesMap).sort().slice(-6)

      setStats({ clientes:clientes||0, hoje:hojeCount, andamento, concluidas:concl.length, fat, desp:desptot, meses })
      setAgendamentos(ag||[])
    } else {
      const { data: ag } = await supabase.from('agendamentos').select('*, clientes(nome)').eq('funcionario_id', u.id).order('data').limit(10)
      setAgendamentos(ag||[])
    }
  }

  if (!user) return null
  const isGestor = user.role === 'gestor'
  const fmt = n => Number(n||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const lucro = stats.fat - stats.desp
  const ticket = stats.concluidas ? stats.fat / stats.concluidas : 0
  const maxVal = Math.max(...(stats.meses||[]).map(([,v])=>v), 1)

  const s = {
    grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:14},
    bigCard:(highlight)=>({background:t.bgCard,border:'1px solid '+(highlight?t.accent:t.border),borderRadius:12,padding:'16px 18px'}),
    card:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,overflow:'hidden',marginBottom:16},
    cardHead:{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft,display:'flex',alignItems:'center',justifyContent:'space-between'},
    cardTitle:{fontSize:14,fontWeight:600,color:t.text},
    linkBtn:{fontSize:11,padding:'5px 12px',borderRadius:8,border:'1px solid '+t.border,color:t.text,background:t.bgSidebar},
    table:{width:'100%',borderCollapse:'collapse',fontSize:13},
    th:{textAlign:'left',padding:'8px 14px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft},
    td:{padding:'10px 14px',borderBottom:'1px solid '+t.borderSoft,color:t.text},
    smallStat:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:'14px 16px'},
    agCard:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'14px 16px',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between'},
  }

  return (
    <Layout title={isGestor ? 'Dashboard' : 'Meus Serviços'}>
      {isGestor ? (
        <>
          {/* CARDS PRINCIPAIS */}
          <div style={s.grid4}>
            <div style={s.bigCard(false)}>
              <div style={{fontSize:12,color:t.textSoft,marginBottom:6}}>Faturamento</div>
              <div style={{fontSize:26,fontWeight:700,color:t.text}}>{fmt(stats.fat)}</div>
              <div style={{fontSize:11,color:t.textSoft,marginTop:4}}>OS concluídas</div>
            </div>
            <div style={s.bigCard(false)}>
              <div style={{fontSize:12,color:t.textSoft,marginBottom:6}}>Despesas</div>
              <div style={{fontSize:26,fontWeight:700,color:'#A32D2D'}}>{fmt(stats.desp)}</div>
              <div style={{fontSize:11,color:t.textSoft,marginTop:4}}>gastos da empresa</div>
            </div>
            <div style={s.bigCard(true)}>
              <div style={{fontSize:12,color:t.textSoft,marginBottom:6}}>Lucro</div>
              <div style={{fontSize:26,fontWeight:700,color:lucro>=0?t.accent:'#A32D2D'}}>{fmt(lucro)}</div>
              <div style={{fontSize:11,color:t.textSoft,marginTop:4}}>faturamento − despesas</div>
            </div>
            <div style={s.bigCard(false)}>
              <div style={{fontSize:12,color:t.textSoft,marginBottom:6}}>Ticket médio</div>
              <div style={{fontSize:26,fontWeight:700,color:t.text}}>{fmt(ticket)}</div>
              <div style={{fontSize:11,color:t.textSoft,marginTop:4}}>por serviço concluído</div>
            </div>
          </div>

          {/* CARDS SECUNDÁRIOS */}
          <div style={s.grid4}>
            <div style={s.smallStat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Clientes ativos</div><div style={{fontSize:20,fontWeight:700,color:t.text}}>{stats.clientes}</div></div>
            <div style={s.smallStat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Em andamento</div><div style={{fontSize:20,fontWeight:700,color:'#854F0B'}}>{stats.andamento}</div></div>
            <div style={s.smallStat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Concluídas</div><div style={{fontSize:20,fontWeight:700,color:'#3B6D11'}}>{stats.concluidas}</div></div>
            <div style={s.smallStat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Agendamentos hoje</div><div style={{fontSize:20,fontWeight:700,color:t.text}}>{stats.hoje}</div></div>
          </div>

          {/* GRÁFICO RECEITA POR MÊS */}
          <div style={s.card}>
            <div style={s.cardHead}><span style={s.cardTitle}>Receita por mês</span><Link href="/faturamento" style={s.linkBtn}>Ver faturamento</Link></div>
            <div style={{padding:'16px 18px'}}>
              {(stats.meses||[]).length===0 && <div style={{fontSize:13,color:t.textSoft}}>Sem dados ainda.</div>}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {(stats.meses||[]).map(([mes,val])=>{
                  const nomeMes = new Date(mes+'-01').toLocaleDateString('pt-BR',{month:'short',year:'2-digit'})
                  return (
                    <div key={mes} style={{display:'flex',alignItems:'center',gap:12,fontSize:12}}>
                      <span style={{width:65,color:t.textSoft,flexShrink:0,textTransform:'capitalize'}}>{nomeMes}</span>
                      <div style={{flex:1,height:12,background:t.bgSidebar,borderRadius:99,overflow:'hidden'}}>
                        <div style={{height:'100%',background:t.accent,borderRadius:99,width:Math.round(val/maxVal*100)+'%',transition:'width .4s'}}/>
                      </div>
                      <span style={{width:100,textAlign:'right',fontWeight:600,color:t.text}}>{fmt(val)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* PRÓXIMOS AGENDAMENTOS */}
          <div style={s.card}>
            <div style={s.cardHead}><span style={s.cardTitle}>Próximos agendamentos</span><Link href="/agendamentos" style={s.linkBtn}>Ver todos</Link></div>
            <table style={s.table}>
              <thead><tr>{['Cliente','Serviço','Data/hora','Funcionário','Status'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>{agendamentos.map(a=>(
                <tr key={a.id}>
                  <td style={s.td}>{a.cliente_nome||a.clientes?.nome||'—'}</td>
                  <td style={s.td}>{a.servico}</td>
                  <td style={s.td}>{new Date(a.data+'T12:00').toLocaleDateString('pt-BR')} {a.hora?.slice(0,5)}</td>
                  <td style={s.td}>{a.usuarios?.nome||<span style={{color:t.textSoft,fontStyle:'italic'}}>Não atribuído</span>}</td>
                  <td style={s.td}><Badge s={a.status}/></td>
                </tr>
              ))}</tbody>
            </table>
            {agendamentos.length===0&&<div style={{padding:20,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhum agendamento.</div>}
          </div>
        </>
      ) : (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
            <div style={s.smallStat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Hoje</div><div style={{fontSize:20,fontWeight:700,color:t.text}}>{agendamentos.filter(a=>a.data===new Date().toISOString().split('T')[0]).length}</div></div>
            <div style={s.smallStat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Próximos</div><div style={{fontSize:20,fontWeight:700,color:t.text}}>{agendamentos.filter(a=>a.data>new Date().toISOString().split('T')[0]).length}</div></div>
            <div style={s.smallStat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Total</div><div style={{fontSize:20,fontWeight:700,color:t.text}}>{agendamentos.length}</div></div>
          </div>
          <div style={{marginBottom:12,fontSize:13,fontWeight:500,color:t.textSoft}}>Seus agendamentos</div>
          {agendamentos.map(a=>(
            <div key={a.id} style={s.agCard}>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:500,marginBottom:2,color:t.text}}>{a.cliente_nome||a.clientes?.nome}</div>
                <div style={{fontSize:12,color:t.textSoft}}>{a.servico} · {new Date(a.data+'T12:00').toLocaleDateString('pt-BR')}</div>
                <div style={{marginTop:6}}><Badge s={a.status}/></div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:22,fontWeight:700,color:t.accent}}>{a.hora?.slice(0,5)}</div>
              </div>
            </div>
          ))}
          {agendamentos.length===0&&<div style={{fontSize:13,color:t.textSoft,padding:16,textAlign:'center'}}>Nenhum agendamento.</div>}
        </>
      )}
    </Layout>
  )
}
