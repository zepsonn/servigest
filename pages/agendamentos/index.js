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
    let q = supabase.from('agendamentos').select('*, clientes(nome, telefone, endereco), usuarios(nome)').order('data').order('hora')
    if (u.role !== 'gestor') q = q.eq('funcionario_id', u.id)
    const { data } = await q
    setAgendamentos(data||[])
  }

  async function concluir(id) {
    await supabase.from('agendamentos').update({status:'concluido'}).eq('id',id)
    loadAgendamentos(user)
  }

  async function apagar(ag) {
    if(!confirm('Apagar agendamento de "'+(ag.clientes?.nome||'cliente')+'"? Esta acao nao pode ser desfeita.')) return
    await supabase.from('agendamentos').delete().eq('id', ag.id)
    loadAgendamentos(user)
  }

  function compartilharWhatsApp(ag) {
    const fmtDate = d => d ? new Date(d+'T12:00').toLocaleDateString('pt-BR') : '-'
    const msg = [
      'Top Eletro - Inova',
      '================================',
      'NOVO SERVICO DISPONIVEL',
      '================================',
      '',
      'Cliente: ' + (ag.clientes?.nome || '-'),
      'Telefone: ' + (ag.clientes?.telefone || '-'),
      'Endereco: ' + (ag.clientes?.endereco || '-'),
      '',
      'Servico: ' + (ag.servico || '-'),
      'Data: ' + fmtDate(ag.data),
      'Hora: ' + (ag.hora?.slice(0,5) || '-'),
      '',
      ag.observacoes ? 'Obs: ' + ag.observacoes : '',
      '',
      '================================',
      'Quem tiver disponibilidade,',
      'responda esta mensagem confirmando!',
      '================================',
      '',
      'Top Eletro - Inova',
      'Tel: (41) 99846-1851 / 3206-7414',
    ].filter(l => l !== null).join('\n')

    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank')
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
              <td style={s.td}><div style={{fontWeight:500}}>{a.clientes?.nome}</div><div style={{fontSize:11,color:'#888'}}>{a.clientes?.telefone}</div></td>
              <td style={s.td}>{a.servico}</td>
              <td style={s.td}>{new Date(a.data+'T12:00').toLocaleDateString('pt-BR')}</td>
              <td style={s.td}>{a.hora?.slice(0,5)}</td>
              <td style={s.td}>{a.usuarios?.nome || <span style={{color:'#aaa',fontStyle:'italic'}}>Não atribuído</span>}</td>
              <td style={s.td}><Badge s={a.status}/></td>
              <td style={s.td}>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  {/* BOTÃO COMPARTILHAR WHATSAPP — destaque */}
                  <button
                    style={{...s.btnSm, background:'#25D366', color:'#fff', border:'1px solid #25D366', fontWeight:500}}
                    onClick={()=>compartilharWhatsApp(a)}
                    title="Compartilhar serviço com técnicos"
                  >
                    📲 Compartilhar
                  </button>
                  {a.status !== 'concluido' && <button style={s.btnSm} onClick={()=>concluir(a.id)}>✓ Concluir</button>}
                  {isGestor && <button style={{...s.btnSm,color:'#A32D2D',borderColor:'#FCEBEB'}} onClick={()=>apagar(a)}>🗑️</button>}
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {agendamentos.length===0 && <div style={{padding:24,textAlign:'center',color:'#aaa',fontSize:13}}>Nenhum agendamento encontrado.</div>}
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
