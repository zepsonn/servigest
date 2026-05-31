import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Faturamento() {
  const [nfs, setNfs] = useState([])
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    setUser(u)
    if(u.role !== 'gestor') { router.push('/dashboard'); return }
    supabase.from('notas_fiscais').select('*, clientes(nome)').order('criado_em',{ascending:false}).then(({data})=>setNfs(data||[]))
  },[])

  const fmt = n => Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const total = nfs.reduce((s,n)=>s+Number(n.total),0)
  const pagas = nfs.filter(n=>n.status==='paga').reduce((s,n)=>s+Number(n.total),0)
  const pendentes = nfs.filter(n=>n.status==='pendente').reduce((s,n)=>s+Number(n.total),0)

  const porMes = nfs.reduce((acc,n)=>{
    const mes = n.data_emissao?.slice(0,7)
    if(!mes) return acc
    acc[mes]=(acc[mes]||0)+Number(n.total)
    return acc
  },{})
  const meses = Object.entries(porMes).sort().slice(-6)
  const maxVal = Math.max(...meses.map(([,v])=>v),1)

  return (
    <Layout title="Faturamento">
      <div style={s.grid3}>
        <Stat label="Faturamento total" value={fmt(total)} sub="acumulado" />
        <Stat label="Recebido" value={fmt(pagas)} sub="notas pagas" />
        <Stat label="A receber" value={fmt(pendentes)} sub="notas pendentes" />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        <div style={s.card}>
          <div style={s.cardTitle}>Receita por mês</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {meses.map(([mes,val])=>(
              <div key={mes} style={{display:'flex',alignItems:'center',gap:10,fontSize:12}}>
                <span style={{width:55,color:'#888',flexShrink:0}}>{mes.slice(5)}/{mes.slice(2,4)}</span>
                <div style={{flex:1,height:8,background:'#f0f0f0',borderRadius:99,overflow:'hidden'}}>
                  <div style={{height:'100%',background:'#1D9E75',borderRadius:99,width:`${Math.round(val/maxVal*100)}%`}}/>
                </div>
                <span style={{width:80,textAlign:'right',fontWeight:500}}>{fmt(val)}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Status das notas</div>
          {[['Pagas','paga','#1D9E75'],['Pendentes','pendente','#E2900A'],['Canceladas','cancelada','#E24B4A']].map(([label,status,color])=>{
            const count = nfs.filter(n=>n.status===status).length
            return <div key={status} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #f5f5f5',fontSize:13}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:10,height:10,borderRadius:'50%',background:color}}/>{label}</div>
              <div style={{fontWeight:600}}>{count}</div>
            </div>
          })}
        </div>
      </div>
      <div style={s.card}>
        <div style={s.cardTitle}>Todas as notas fiscais</div>
        <table style={s.table}>
          <thead><tr>{['Nº','Cliente','Total','Emissão','Vencimento','Status'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{nfs.map(n=>(
            <tr key={n.id}>
              <td style={s.td}>#{n.numero}</td>
              <td style={s.td}>{n.clientes?.nome}</td>
              <td style={s.td}><strong>{fmt(n.total)}</strong></td>
              <td style={s.td}>{n.data_emissao ? new Date(n.data_emissao+'T12:00').toLocaleDateString('pt-BR') : '—'}</td>
              <td style={s.td}>{n.data_vencimento ? new Date(n.data_vencimento+'T12:00').toLocaleDateString('pt-BR') : '—'}</td>
              <td style={s.td}><span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:n.status==='paga'?'#EAF3DE':'#FAEEDA',color:n.status==='paga'?'#3B6D11':'#854F0B'}}>{n.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Layout>
  )
}

function Stat({label,value,sub}){
  return <div style={s.stat}><div style={{fontSize:11,color:'#888',marginBottom:4}}>{label}</div><div style={{fontSize:20,fontWeight:700}}>{value}</div><div style={{fontSize:11,color:'#1D9E75',marginTop:2}}>{sub}</div></div>
}

const s = {
  grid3:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20},
  stat:{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:'14px 16px'},
  card:{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:16,marginBottom:0},
  cardTitle:{fontSize:13,fontWeight:600,marginBottom:14,color:'#444'},
  table:{width:'100%',borderCollapse:'collapse',fontSize:13},
  th:{textAlign:'left',padding:'8px 12px',color:'#888',fontWeight:500,fontSize:11,background:'#fafaf8',borderBottom:'1px solid #f0f0f0'},
  td:{padding:'9px 12px',borderBottom:'1px solid #f8f8f8'},
}
