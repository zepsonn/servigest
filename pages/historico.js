import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

export default function Historico() {
  const [hist, setHist] = useState([])

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    supabase.from('agendamentos').select('*, clientes(nome)').eq('funcionario_id',u.id).eq('status','concluido').order('data',{ascending:false}).then(({data})=>setHist(data||[]))
  },[])

  const fmtDate = d => d ? new Date(d+'T12:00').toLocaleDateString('pt-BR') : '—'

  return (
    <Layout title="Histórico de Serviços">
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {hist.length===0 && <div style={{fontSize:13,color:'#888',padding:16}}>Nenhum serviço concluído ainda.</div>}
        {hist.map(a=>(
          <div key={a.id} style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:'14px 16px',borderLeft:'3px solid #1D9E75'}}>
            <div style={{fontSize:10,color:'#888',marginBottom:3}}>{fmtDate(a.data)} · {a.hora?.slice(0,5)}</div>
            <div style={{fontSize:14,fontWeight:500}}>{a.clientes?.nome}</div>
            <div style={{fontSize:12,color:'#888',marginTop:2}}>{a.servico}</div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
