import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { useRouter } from 'next/router'

export default function Faturamento() {
  const [os, setOs] = useState([])
  const { t } = useTheme()
  const router = useRouter()

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    if(u.role !== 'gestor') { router.push('/dashboard'); return }
    supabase.from('ordens_servico').select('*, clientes(nome)').order('criado_em',{ascending:false}).then(({data})=>setOs(data||[]))
  },[])

  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const concluidas = os.filter(o=>o.status==='concluida')
  const total = concluidas.reduce((s,o)=>s+Number(o.valor||0),0)
  const aberto = os.filter(o=>o.status!=='concluida'&&o.status!=='cancelada').reduce((s,o)=>s+Number(o.valor||0),0)
  const porMes = concluidas.reduce((acc,o)=>{
    const mes=(o.data_conclusao||o.data_entrada)?.slice(0,7)
    if(!mes) return acc
    acc[mes]=(acc[mes]||0)+Number(o.valor||0); return acc
  },{})
  const meses = Object.entries(porMes).sort().slice(-6)
  const maxVal = Math.max(...meses.map(([,v])=>v),1)

  const s = {
    grid3:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20},
    stat:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'14px 16px'},
    card:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:16,marginBottom:16},
    cardTitle:{fontSize:13,fontWeight:600,marginBottom:14,color:t.text},
    table:{width:'100%',borderCollapse:'collapse',fontSize:13},
    th:{textAlign:'left',padding:'8px 12px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft},
    td:{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text},
  }

  return (
    <Layout title="Faturamento">
      <div style={s.grid3}>
        {[[' Faturamento total',fmt(total),'OS concluídas'],['Pendente',fmt(aberto),'em aberto'],['Total OS',os.length,'no sistema']].map(([l,v,sub],i)=>(
          <div key={i} style={s.stat}>
            <div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>{l}</div>
            <div style={{fontSize:20,fontWeight:700,color:t.text}}>{v}</div>
            <div style={{fontSize:11,color:t.accent,marginTop:2}}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={s.card}>
          <div style={s.cardTitle}>Receita por mês</div>
          {meses.length===0&&<div style={{fontSize:13,color:t.textSoft}}>Sem dados ainda.</div>}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {meses.map(([mes,val])=>(
              <div key={mes} style={{display:'flex',alignItems:'center',gap:10,fontSize:12}}>
                <span style={{width:55,color:t.textSoft,flexShrink:0}}>{mes.slice(5)}/{mes.slice(2,4)}</span>
                <div style={{flex:1,height:8,background:t.bgSidebar,borderRadius:99,overflow:'hidden'}}>
                  <div style={{height:'100%',background:t.accent,borderRadius:99,width:Math.round(val/maxVal*100)+'%'}}/>
                </div>
                <span style={{width:80,textAlign:'right',fontWeight:500,color:t.text}}>{fmt(val)}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Status das OS</div>
          {[['Concluídas','concluida',t.accent],['Abertas','aberta','#185FA5'],['Em andamento','em_andamento','#854F0B'],['Canceladas','cancelada','#A32D2D']].map(([label,status,color])=>(
            <div key={status} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid '+t.borderSoft,fontSize:13}}>
              <div style={{display:'flex',alignItems:'center',gap:8,color:t.text}}><div style={{width:10,height:10,borderRadius:'50%',background:color}}/>{label}</div>
              <div style={{fontWeight:600,color:t.text}}>{os.filter(o=>o.status===status).length}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={s.card}>
        <div style={s.cardTitle}>Todas as ordens de serviço</div>
        <table style={s.table}>
          <thead><tr>{['Nº','Cliente','Total','Emissão','Conclusão','Status'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{os.map(o=>(
            <tr key={o.id}>
              <td style={s.td}>#{o.numero}</td>
              <td style={s.td}>{o.cliente_nome||'—'}</td>
              <td style={s.td}><strong style={{color:t.text}}>{fmt(o.valor)}</strong></td>
              <td style={s.td}>{o.data_entrada?new Date(o.data_entrada+'T12:00').toLocaleDateString('pt-BR'):'—'}</td>
              <td style={s.td}>{o.data_conclusao?new Date(o.data_conclusao+'T12:00').toLocaleDateString('pt-BR'):'—'}</td>
              <td style={s.td}><span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:o.status==='concluida'?'#EAF3DE':'#FAEEDA',color:o.status==='concluida'?'#3B6D11':'#854F0B'}}>{o.status?.replace('_',' ')}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Layout>
  )
}
