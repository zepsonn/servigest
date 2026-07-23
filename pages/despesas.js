import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { useRouter } from 'next/router'

// fora do componente (corrige bug de foco)
function FG({label,value,onChange,t,type,textarea}){
  const st={width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit',background:t.bgInput,color:t.text,minHeight:textarea?60:undefined,resize:textarea?'vertical':undefined}
  return <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}}>{label}</label>{textarea?<textarea style={st} value={value} onChange={e=>onChange(e.target.value)}/>:<input type={type||'text'} style={st} value={value} onChange={e=>onChange(e.target.value)}/>}</div>
}

export default function Despesas() {
  const [despesas, setDespesas] = useState([])
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({descricao:'',categoria:'Geral',valor:0,data:new Date().toISOString().split('T')[0],observacoes:''})
  const [editForm, setEditForm] = useState({})
  const { t } = useTheme()
  const router = useRouter()

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    if(u.role !== 'gestor') { router.push('/dashboard'); return }
    load()
  },[])

  async function load() {
    const { data } = await supabase.from('despesas').select('*').order('data',{ascending:false})
    setDespesas(data||[])
  }
  async function salvar() {
    if(!form.descricao) { alert('Digite a descrição'); return }
    await supabase.from('despesas').insert([{...form,valor:Number(form.valor)||0}])
    setModal(false); setForm({descricao:'',categoria:'Geral',valor:0,data:new Date().toISOString().split('T')[0],observacoes:''}); load()
  }
  async function salvarEdicao() {
    await supabase.from('despesas').update({descricao:editForm.descricao,categoria:editForm.categoria,valor:Number(editForm.valor)||0,data:editForm.data,observacoes:editForm.observacoes}).eq('id',editModal.id)
    setEditModal(null); load()
  }
  async function apagar(d) {
    if(!confirm('Apagar a despesa "'+d.descricao+'"?')) return
    await supabase.from('despesas').delete().eq('id',d.id); load()
  }

  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const total = despesas.reduce((s,d)=>s+Number(d.valor||0),0)
  const mesAtual = new Date().toISOString().slice(0,7)
  const totalMes = despesas.filter(d=>(d.data||'').slice(0,7)===mesAtual).reduce((s,d)=>s+Number(d.valor||0),0)
  const categorias = ['Geral','Peças','Ferramentas','Combustível','Aluguel','Salários','Impostos','Marketing','Outros']

  const s = {
    grid2:{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:20},
    stat:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,boxShadow:t.shadow,padding:'14px 16px'},
    card:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'},
    table:{width:'100%',borderCollapse:'collapse',fontSize:13},
    th:{textAlign:'left',padding:'8px 12px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft},
    td:{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text},
    btnSm:{padding:'4px 10px',borderRadius:6,border:'1px solid '+t.border,fontSize:11,cursor:'pointer',background:t.bgCard,fontFamily:'inherit',color:t.text},
    btnPrimary:{padding:'7px 14px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500,fontFamily:'inherit'},
    btnSecondary:{padding:'7px 14px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:13,cursor:'pointer',fontFamily:'inherit'},
    inp:{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit',background:t.bgInput,color:t.text},
    lbl:{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3},
  }

  return (
    <Layout title="Despesas">
      <div style={s.grid2}>
        <div style={s.stat}><div style={{fontSize:10,color:t.textSoft,marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>Total de despesas</div><div style={{fontSize:24,fontWeight:700,fontVariantNumeric:'tabular-nums',color:'#A32D2D'}}>{fmt(total)}</div></div>
        <div style={s.stat}><div style={{fontSize:10,color:t.textSoft,marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>Despesas deste mês</div><div style={{fontSize:24,fontWeight:700,fontVariantNumeric:'tabular-nums',color:t.text}}>{fmt(totalMes)}</div></div>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button style={s.btnPrimary} onClick={()=>setModal(true)}>+ Nova despesa</button>
      </div>
      <div style={s.card}>
        <table style={s.table}>
          <thead><tr>{['Descrição','Categoria','Valor','Data','Ações'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{despesas.map(d=>(
            <tr key={d.id}>
              <td style={s.td}><strong style={{color:t.text}}>{d.descricao}</strong>{d.observacoes&&<div style={{fontSize:11,color:t.textSoft}}>{d.observacoes}</div>}</td>
              <td style={s.td}><span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,background:t.bgSidebar,color:t.textSoft}}>{d.categoria}</span></td>
              <td style={s.td}><strong style={{color:'#A32D2D'}}>{fmt(d.valor)}</strong></td>
              <td style={s.td}>{d.data?new Date(d.data+'T12:00').toLocaleDateString('pt-BR'):'—'}</td>
              <td style={s.td}><div style={{display:'flex',gap:5}}>
                <button style={s.btnSm} onClick={()=>{setEditForm({...d});setEditModal(d)}}>✏️ Editar</button>
                <button style={{...s.btnSm,color:'#A32D2D',borderColor:'#FCEBEB'}} onClick={()=>apagar(d)}>🗑️ Apagar</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
        {despesas.length===0&&<div style={{padding:24,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhuma despesa lançada.</div>}
      </div>

      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:t.bgCard,borderRadius:12,padding:24,width:460,maxWidth:'96vw',border:'1px solid '+t.border}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}><span>Nova despesa</span><button style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:t.textSoft}} onClick={()=>setModal(false)}>×</button></div>
            <FG label="Descrição *" value={form.descricao} onChange={v=>setForm({...form,descricao:v})} t={t}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div style={{marginBottom:12}}><label style={s.lbl}>Categoria</label><select style={s.inp} value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})}>{categorias.map(c=><option key={c}>{c}</option>)}</select></div>
              <FG label="Valor (R$)" value={form.valor} onChange={v=>setForm({...form,valor:v})} t={t} type="number"/>
            </div>
            <FG label="Data" value={form.data} onChange={v=>setForm({...form,data:v})} t={t} type="date"/>
            <FG label="Observações" value={form.observacoes} onChange={v=>setForm({...form,observacoes:v})} t={t} textarea/>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}><button style={s.btnSecondary} onClick={()=>setModal(false)}>Cancelar</button><button style={s.btnPrimary} onClick={salvar}>Salvar</button></div>
          </div>
        </div>
      )}

      {editModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:t.bgCard,borderRadius:12,padding:24,width:460,maxWidth:'96vw',border:'1px solid '+t.border}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}><span>Editar despesa</span><button style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:t.textSoft}} onClick={()=>setEditModal(null)}>×</button></div>
            <FG label="Descrição *" value={editForm.descricao} onChange={v=>setEditForm({...editForm,descricao:v})} t={t}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div style={{marginBottom:12}}><label style={s.lbl}>Categoria</label><select style={s.inp} value={editForm.categoria||'Geral'} onChange={e=>setEditForm({...editForm,categoria:e.target.value})}>{categorias.map(c=><option key={c}>{c}</option>)}</select></div>
              <FG label="Valor (R$)" value={editForm.valor} onChange={v=>setEditForm({...editForm,valor:v})} t={t} type="number"/>
            </div>
            <FG label="Data" value={editForm.data} onChange={v=>setEditForm({...editForm,data:v})} t={t} type="date"/>
            <FG label="Observações" value={editForm.observacoes} onChange={v=>setEditForm({...editForm,observacoes:v})} t={t} textarea/>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}><button style={s.btnSecondary} onClick={()=>setEditModal(null)}>Cancelar</button><button style={s.btnPrimary} onClick={salvarEdicao}>Salvar alterações</button></div>
          </div>
        </div>
      )}
    </Layout>
  )
}
