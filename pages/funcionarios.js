import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { useRouter } from 'next/router'

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([])
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({nome:'',username:'',senha:'',role:'funcionario'})
  const [editForm, setEditForm] = useState({})
  const { t } = useTheme()
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
    if (!form.nome||!form.username||!form.senha) return
    await supabase.from('usuarios').insert([form]); setModal(false)
    setForm({nome:'',username:'',senha:'',role:'funcionario'}); loadFuncionarios()
  }
  async function salvarEdicao() {
    await supabase.from('usuarios').update({nome:editForm.nome,username:editForm.username,senha:editForm.senha,role:editForm.role,ativo:editForm.ativo}).eq('id',editModal.id)
    setEditModal(null); loadFuncionarios()
  }
  async function apagar(f) {
    if(f.role==='gestor'){alert('Nao é possível apagar o gestor.');return}
    if(!confirm('Apagar "'+f.nome+'"?')) return
    await supabase.from('usuarios').delete().eq('id',f.id); loadFuncionarios()
  }
  async function toggleAtivo(f) {
    await supabase.from('usuarios').update({ativo:!f.ativo}).eq('id',f.id); loadFuncionarios()
  }

  const s = mk(t)
  const campos = [['nome','Nome completo'],['username','Usuário (login)'],['senha','Senha']]

  return (
    <Layout title="Funcionários">
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button style={s.btnPrimary} onClick={()=>setModal(true)}>+ Novo funcionário</button>
      </div>
      <div style={s.card}>
        <table style={s.table}>
          <thead><tr>{['Nome','Usuário','Perfil','Status','Ações'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{funcionarios.map(f=>(
            <tr key={f.id}>
              <td style={s.td}><strong style={{color:t.text}}>{f.nome}</strong></td>
              <td style={s.td}><code style={{fontSize:11,background:t.bgSidebar,padding:'2px 6px',borderRadius:4,color:t.text}}>{f.username}</code></td>
              <td style={s.td}><span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:f.role==='gestor'?'#E6F1FB':'#EAF3DE',color:f.role==='gestor'?'#185FA5':'#3B6D11'}}>{f.role}</span></td>
              <td style={s.td}><span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:f.ativo?'#EAF3DE':'#FCEBEB',color:f.ativo?'#3B6D11':'#A32D2D'}}>{f.ativo?'Ativo':'Inativo'}</span></td>
              <td style={s.td}><div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                <button style={s.btnSm} onClick={()=>{setEditForm({...f});setEditModal(f)}}>Editar</button>
                <button style={{...s.btnSm,color:f.ativo?'#854F0B':'#3B6D11'}} onClick={()=>toggleAtivo(f)}>{f.ativo?'Desativar':'Ativar'}</button>
                {f.role!=='gestor'&&<button style={{...s.btnSm,color:'#A32D2D',borderColor:'#FCEBEB'}} onClick={()=>apagar(f)}>Apagar</button>}
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {modal&&<Modal title="Novo funcionário" onClose={()=>setModal(false)} t={t}>
        {campos.map(([k,l])=><FG key={k} label={l} value={form[k]} onChange={v=>setForm({...form,[k]:v})} t={t}/>)}
        <div style={s.fg}><label style={s.lbl}>Perfil</label>
          <select style={s.inp} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
            <option value="funcionario">Funcionário</option><option value="gestor">Gestor</option>
          </select>
        </div>
        <BtnRow onCancel={()=>setModal(false)} onSave={salvar} t={t}/>
      </Modal>}

      {editModal&&<Modal title={'Editar — '+editModal.nome} onClose={()=>setEditModal(null)} t={t}>
        {campos.map(([k,l])=><FG key={k} label={l} value={editForm[k]||''} onChange={v=>setEditForm({...editForm,[k]:v})} t={t}/>)}
        <div style={s.fg}><label style={s.lbl}>Perfil</label>
          <select style={s.inp} value={editForm.role||'funcionario'} onChange={e=>setEditForm({...editForm,role:e.target.value})}>
            <option value="funcionario">Funcionário</option><option value="gestor">Gestor</option>
          </select>
        </div>
        <div style={s.fg}><label style={s.lbl}>Status</label>
          <select style={s.inp} value={editForm.ativo?'true':'false'} onChange={e=>setEditForm({...editForm,ativo:e.target.value==='true'})}>
            <option value="true">Ativo</option><option value="false">Inativo</option>
          </select>
        </div>
        <BtnRow onCancel={()=>setEditModal(null)} onSave={salvarEdicao} t={t} label="Salvar alterações"/>
      </Modal>}
    </Layout>
  )
}

function Modal({title,onClose,children,t}){return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{background:t.bgCard,borderRadius:12,padding:24,width:440,maxWidth:'96vw',border:'1px solid '+t.border}}><div style={{fontSize:15,fontWeight:500,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center',color:t.text}}><span>{title}</span><button style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:t.textSoft}} onClick={onClose}>×</button></div>{children}</div></div>}
function FG({label,value,onChange,t}){return <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}}>{label}</label><input style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit',background:t.bgInput,color:t.text}} value={value} onChange={e=>onChange(e.target.value)}/></div>}
function BtnRow({onCancel,onSave,t,label}){return <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}><button style={{padding:'7px 14px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:13,cursor:'pointer',fontFamily:'inherit'}} onClick={onCancel}>Cancelar</button><button style={{padding:'7px 14px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontFamily:'inherit',fontWeight:500}} onClick={onSave}>{label||'Salvar'}</button></div>}
function mk(t){return{
  card:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'},
  table:{width:'100%',borderCollapse:'collapse',fontSize:13},
  th:{textAlign:'left',padding:'8px 12px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft},
  td:{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text},
  btnSm:{padding:'4px 10px',borderRadius:6,border:'1px solid '+t.border,fontSize:11,cursor:'pointer',background:t.bgCard,fontFamily:'inherit',color:t.text},
  btnPrimary:{padding:'7px 14px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500,fontFamily:'inherit'},
  fg:{marginBottom:12},lbl:{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3},
  inp:{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit',background:t.bgInput,color:t.text},
}}
