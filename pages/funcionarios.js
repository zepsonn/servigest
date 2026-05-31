import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({nome:'',username:'',senha:'',role:'funcionario'})
  const router = useRouter()

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    if(u.role !== 'gestor') { router.push('/dashboard'); return }
    loadFuncionarios()
  },[])

  async function loadFuncionarios() {
    const { data } = await supabase.from('usuarios').select('*').order('nome')
    setFuncionarios(data||[])
  }

  async function salvar() {
    if (!form.nome || !form.username || !form.senha) return
    await supabase.from('usuarios').insert([form])
    setModal(false)
    setForm({nome:'',username:'',senha:'',role:'funcionario'})
    loadFuncionarios()
  }

  return (
    <Layout title="Funcionários">
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button style={s.btnPrimary} onClick={()=>setModal(true)}>+ Novo funcionário</button>
      </div>
      <div style={s.card}>
        <table style={s.table}>
          <thead><tr>{['Nome','Usuário','Perfil','Status'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{funcionarios.map(f=>(
            <tr key={f.id}>
              <td style={s.td}><strong>{f.nome}</strong></td>
              <td style={s.td}><code style={{fontSize:11,background:'#f5f5f3',padding:'2px 6px',borderRadius:4}}>{f.username}</code></td>
              <td style={s.td}><span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:f.role==='gestor'?'#E6F1FB':'#EAF3DE',color:f.role==='gestor'?'#185FA5':'#3B6D11'}}>{f.role}</span></td>
              <td style={s.td}><span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:f.ativo?'#EAF3DE':'#FCEBEB',color:f.ativo?'#3B6D11':'#A32D2D'}}>{f.ativo?'Ativo':'Inativo'}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.mHead}><span>Novo funcionário</span><button style={s.xBtn} onClick={()=>setModal(false)}>×</button></div>
            {[['nome','Nome completo'],['username','Usuário (login)'],['senha','Senha']].map(([k,l])=>(
              <div key={k} style={s.fg}><label style={s.label}>{l}</label><input style={s.input} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} /></div>
            ))}
            <div style={s.fg}><label style={s.label}>Perfil</label>
              <select style={s.input} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                <option value="funcionario">Funcionário</option><option value="gestor">Gestor</option>
              </select>
            </div>
            <div style={s.btnRow}><button style={s.btnSecondary} onClick={()=>setModal(false)}>Cancelar</button><button style={s.btnPrimary} onClick={salvar}>Salvar</button></div>
          </div>
        </div>
      )}
    </Layout>
  )
}

const s = {
  card:{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,overflow:'hidden'},
  table:{width:'100%',borderCollapse:'collapse',fontSize:13},
  th:{textAlign:'left',padding:'8px 12px',color:'#888',fontWeight:500,fontSize:11,background:'#fafaf8',borderBottom:'1px solid #f0f0f0'},
  td:{padding:'9px 12px',borderBottom:'1px solid #f8f8f8'},
  btnPrimary:{padding:'7px 14px',borderRadius:8,background:'#1D9E75',color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500,fontFamily:'inherit'},
  btnSecondary:{padding:'7px 14px',borderRadius:8,background:'transparent',color:'#666',border:'1px solid #e0e0e0',fontSize:13,cursor:'pointer',fontFamily:'inherit'},
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'},
  modal:{background:'#fff',borderRadius:12,padding:24,width:420,maxWidth:'95vw'},
  mHead:{fontSize:15,fontWeight:500,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'},
  xBtn:{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'},
  fg:{marginBottom:12},
  label:{display:'block',fontSize:11,color:'#888',fontWeight:500,marginBottom:3},
  input:{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:13,fontFamily:'inherit'},
  btnRow:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16},
}
