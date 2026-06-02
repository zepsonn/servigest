import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

const badgeColors = {agendado:['#E6F1FB','#185FA5'],confirmado:['#EAF3DE','#3B6D11'],pendente:['#FAEEDA','#854F0B'],concluido:['#EAF3DE','#3B6D11'],cancelado:['#FCEBEB','#A32D2D']}
function Badge({s}){ const [bg,c]=badgeColors[s]||['#F1EFE8','#5F5E5A']; return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{s}</span>}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [agendamentos, setAgendamentos] = useState([])
  const [stats, setStats] = useState({clientes:0, hoje:0, os_abertas:0, fat:0})

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('servigest_user') || '{}')
    setUser(u)
    loadData(u)
  }, [])

  async function loadData(u) {
    const hoje = new Date().toISOString().split('T')[0]
    if (u.role === 'gestor') {
      const [
        { count: clientes },
        { data: ag },
        { data: os },
      ] = await Promise.all([
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('ativo', true),
        supabase.from('agendamentos').select('*, clientes(nome), usuarios(nome)').order('data').order('hora').limit(5),
        supabase.from('ordens_servico').select('valor, status'),
      ])

      // faturamento APENAS de OS concluidas
      const fat = (os||[]).filter(o => o.status === 'concluida').reduce((s,o) => s + Number(o.valor||0), 0)
      const os_abertas = (os||[]).filter(o => o.status === 'aberta' || o.status === 'em_andamento').length
      const hojeCount = (ag||[]).filter(a => a.data === hoje).length

      setStats({ clientes: clientes||0, hoje: hojeCount, os_abertas, fat })
      setAgendamentos(ag||[])
    } else {
      const { data: ag } = await supabase
        .from('agendamentos')
        .select('*, clientes(nome)')
        .eq('funcionario_id', u.id)
        .order('data')
        .limit(10)
      setAgendamentos(ag||[])
    }
  }

  if (!user) return null
  const isGestor = user.role === 'gestor'
  const fmt = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <Layout title={isGestor ? 'Dashboard' : 'Meus Serviços'}>
      {isGestor ? (
        <>
          <div style={s.grid4}>
            <Stat label="Clientes ativos" value={stats.clientes} sub="cadastrados" />
            <Stat label="Agendamentos hoje" value={stats.hoje} sub="do dia" />
            <Stat label="OS em aberto" value={stats.os_abertas} sub="abertas e em andamento" />
            <Stat label="Faturamento (OS)" value={fmt(stats.fat)} sub="OS concluídas" />
          </div>
          <div style={s.card}>
            <div style={s.cardHead}>
              <span style={s.cardTitle}>Próximos agendamentos</span>
              <Link href="/agendamentos" style={s.linkBtn}>Ver todos</Link>
            </div>
            <table style={s.table}>
              <thead><tr>{['Cliente','Serviço','Data/hora','Funcionário','Status',''].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>{agendamentos.map(a=>(
                <tr key={a.id}>
                  <td style={s.td}>{a.clientes?.nome}</td>
                  <td style={s.td}>{a.servico}</td>
                  <td style={s.td}>{new Date(a.data+'T12:00').toLocaleDateString('pt-BR')} {a.hora?.slice(0,5)}</td>
                  <td style={s.td}>{a.usuarios?.nome||<span style={{color:'#aaa',fontStyle:'italic'}}>Não atribuído</span>}</td>
                  <td style={s.td}><Badge s={a.status}/></td>
                  <td style={s.td}><Link href="/os" style={{...s.linkBtn,background:'#1D9E75',color:'#fff',border:'none'}}>OS</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div style={s.grid3}>
            <Stat label="Hoje" value={agendamentos.filter(a=>a.data===new Date().toISOString().split('T')[0]).length} sub="serviços" />
            <Stat label="Próximos" value={agendamentos.filter(a=>a.data>new Date().toISOString().split('T')[0]).length} sub="agendados" />
            <Stat label="Total" value={agendamentos.length} sub="registros" />
          </div>
          <div style={{marginBottom:12,fontSize:13,fontWeight:500,color:'#888'}}>Seus agendamentos</div>
          {agendamentos.map(a=>(
            <div key={a.id} style={s.agCard}>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:500,marginBottom:2}}>{a.clientes?.nome}</div>
                <div style={{fontSize:12,color:'#888'}}>{a.servico} · {new Date(a.data+'T12:00').toLocaleDateString('pt-BR')}</div>
                <div style={{marginTop:6}}><Badge s={a.status}/></div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:22,fontWeight:700,color:'#1D9E75'}}>{a.hora?.slice(0,5)}</div>
                <div style={{fontSize:11,color:'#888'}}>{new Date(a.data+'T12:00').toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          ))}
          {agendamentos.length===0 && <div style={{fontSize:13,color:'#aaa',padding:16,textAlign:'center'}}>Nenhum agendamento encontrado.</div>}
        </>
      )}
    </Layout>
  )
}

function Stat({label,value,sub}){
  return <div style={s.stat}><div style={s.statLabel}>{label}</div><div style={s.statValue}>{value}</div><div style={s.statSub}>{sub}</div></div>
}

const s = {
  grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20},
  grid3:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20},
  stat:{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:'14px 16px'},
  statLabel:{fontSize:11,color:'#888',marginBottom:4},
  statValue:{fontSize:22,fontWeight:700},
  statSub:{fontSize:11,color:'#1D9E75',marginTop:2},
  card:{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,overflow:'hidden',marginBottom:16},
  cardHead:{padding:'12px 16px',borderBottom:'1px solid #f0f0f0',display:'flex',alignItems:'center',justifyContent:'space-between'},
  cardTitle:{fontSize:13,fontWeight:500},
  linkBtn:{fontSize:11,padding:'4px 10px',borderRadius:6,border:'1px solid #e0e0e0',color:'#1a1a1a',background:'#fafaf8'},
  table:{width:'100%',borderCollapse:'collapse',fontSize:13},
  th:{textAlign:'left',padding:'8px 12px',color:'#888',fontWeight:500,fontSize:11,background:'#fafaf8',borderBottom:'1px solid #f0f0f0'},
  td:{padding:'9px 12px',borderBottom:'1px solid #f8f8f8'},
  agCard:{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:'14px 16px',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between'},
}
