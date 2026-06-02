import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const badgeColors = {agendado:['#E6F1FB','#185FA5'],confirmado:['#EAF3DE','#3B6D11'],pendente:['#FAEEDA','#854F0B'],concluido:['#EAF3DE','#3B6D11'],cancelado:['#FCEBEB','#A32D2D']}
function Badge({s}){ const [bg,c]=badgeColors[s]||['#F1EFE8','#5F5E5A']; return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{s}</span>}

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([])
  const [user, setUser] = useState(null)

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    setUser(u)
    loadAgendamentos(u)
  },[])

  async function loadAgendamentos(u) {
    let q = supabase.from('agendamentos').select('*, clientes(nome), usuarios(nome)').order('data').order('hora')
    if (u.role !== 'gestor') q = q.eq('funcionario_id', u.id)
    const { data } = await q
    setAgendamentos(data||[])
  }

  async function concluir(id) {
    await supabase.from('agendamentos').update({status:'concluido'}).eq('id',id)
    loadAgendamentos(user)
  }

  async function apagar(ag) {
    if(!confirm('Apagar agendamento de "'+( ag.clientes?.nome||'cliente')+'\" em '+ag.data+'? Esta ação não pode ser desfeita.')) return
    await supabase.from('agendamentos').delete().eq('id', ag.id)
    loadAgendamentos(user)
  }

  const isGestor = user?.role === 'gestor'

  return (
    <Layout title="Agendamentos">
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        {isGestor && <Link href="/agendamentos/novo" style={s.btnPrimary}>+ Novo agendamento</Link>}
      </div>
      <div style={s.card}>
        <table style={s.table}>
          <thead><tr>{['Cliente','Serviço','Data','Hora','Funcionário','Status','Ações'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{agendamentos.map(a=>(
            <tr key={a.id}>
              <td style={s.td}>{a.clientes?.nome}</td>
              <td style={s.td}>{a.servico}</td>
              <td style={s.td}>{new Date(a.data+'T12:00').toLocaleDateString('pt-BR')}</td>
              <td style={s.td}>{a.hora?.slice(0,5)}</td>
              <td style={s.td}>{a.usuarios?.nome}</td>
              <td style={s.td}><Badge s={a.status}/></td>
              <td style={s.td}>
                <div style={{display:'flex',gap:5}}>
                  {a.status !== 'concluido' && <button style={s.btnSm} onClick={()=>concluir(a.id)}>✓ Concluir</button>}
                  {isGestor && <button style={s.btnSm} onClick={()=>apagar(a)}>🗑️ Apagar</button>}
                  {isGestor && <Link href="/notas" style={{...s.btnSm,...s.btnPrimary}}>🧾 NF</Link>}
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Layout>
  )
}

const s = {
  card:{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,overflow:'hidden'},
  table:{width:'100%',borderCollapse:'collapse',fontSize:13},
  th:{textAlign:'left',padding:'8px 12px',color:'#888',fontWeight:500,fontSize:11,background:'#fafaf8',borderBottom:'1px solid #f0f0f0'},
  td:{padding:'9px 12px',borderBottom:'1px solid #f8f8f8'},
  btnSm:{padding:'4px 10px',borderRadius:6,border:'1px solid #e0e0e0',fontSize:11,cursor:'pointer',background:'#fff',fontFamily:'inherit'},
  btnPrimary:{display:'inline-flex',padding:'7px 14px',borderRadius:8,background:'#1D9E75',color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontFamily:'inherit',fontWeight:500,alignItems:'center'},
}
