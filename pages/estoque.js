import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { useRouter } from 'next/router'

function FG({label,value,onChange,t,type}){
  const st={width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit',background:t.bgInput,color:t.text}
  return <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}}>{label}</label><input type={type||'text'} style={st} value={value} onChange={e=>onChange(e.target.value)}/></div>
}

export default function Estoque() {
  const [produtos, setProdutos] = useState([])
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({nome:'',quantidade:0,preco_custo:0,preco_venda:0})
  const [editForm, setEditForm] = useState({})
  const { t } = useTheme()
  const router = useRouter()

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    if(u.role !== 'gestor') { router.push('/dashboard'); return }
    load()
  },[])

  async function load() {
    const { data } = await supabase.from('produtos').select('*').order('nome')
    setProdutos(data||[])
  }
  async function salvar() {
    if(!form.nome) { alert('Digite o nome do produto'); return }
    await supabase.from('produtos').insert([{nome:form.nome,quantidade:Number(form.quantidade)||0,preco_custo:Number(form.preco_custo)||0,preco_venda:Number(form.preco_venda)||0}])
    setModal(false); setForm({nome:'',quantidade:0,preco_custo:0,preco_venda:0}); load()
  }
  async function salvarEdicao() {
    await supabase.from('produtos').update({nome:editForm.nome,quantidade:Number(editForm.quantidade)||0,preco_custo:Number(editForm.preco_custo)||0,preco_venda:Number(editForm.preco_venda)||0}).eq('id',editModal.id)
    setEditModal(null); load()
  }
  async function apagar(p) {
    if(!confirm('Apagar o produto "'+p.nome+'"?')) return
    await supabase.from('produtos').delete().eq('id',p.id); load()
  }

  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const filtrados = produtos.filter(p=>p.nome.toLowerCase().includes(busca.toLowerCase()))
  const valorEstoque = produtos.reduce((s,p)=>s+Number(p.preco_custo||0)*Number(p.quantidade||0),0)
  const itensTotal = produtos.reduce((s,p)=>s+Number(p.quantidade||0),0)
  const semEstoque = produtos.filter(p=>Number(p.quantidade||0)<=0).length

  const s = {
    grid3:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20},
    stat:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'14px 16px'},
    toolbar:{display:'flex',gap:8,marginBottom:16},
    search:{flex:1,padding:'8px 14px',borderRadius:8,border:'1px solid '+t.border,background:t.bgInput,fontSize:13,fontFamily:'inherit',color:t.text},
    card:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,overflow:'hidden'},
    table:{width:'100%',borderCollapse:'collapse',fontSize:13},
    th:{textAlign:'left',padding:'8px 12px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft},
    td:{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text},
    btnSm:{padding:'4px 10px',borderRadius:6,border:'1px solid '+t.border,fontSize:11,cursor:'pointer',background:t.bgCard,fontFamily:'inherit',color:t.text},
    btnPrimary:{padding:'7px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500,fontFamily:'inherit'},
    btnSecondary:{padding:'7px 14px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:13,cursor:'pointer',fontFamily:'inherit'},
  }

  return (
    <Layout title="Estoque">
      <div style={s.grid3}>
        <div style={s.stat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Itens em estoque</div><div style={{fontSize:22,fontWeight:700,color:t.text}}>{itensTotal}</div></div>
        <div style={s.stat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Valor investido (custo)</div><div style={{fontSize:22,fontWeight:700,color:t.text}}>{fmt(valorEstoque)}</div></div>
        <div style={s.stat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Produtos sem estoque</div><div style={{fontSize:22,fontWeight:700,color:semEstoque>0?'#A32D2D':t.text}}>{semEstoque}</div></div>
      </div>
      <div style={s.toolbar}>
        <input style={s.search} placeholder="Buscar produto..." value={busca} onChange={e=>setBusca(e.target.value)}/>
        <button style={s.btnPrimary} onClick={()=>setModal(true)}>+ Novo produto</button>
      </div>
      <div style={s.card}>
        <table style={s.table}>
          <thead><tr>{['Produto','Qtd','Custo','Venda','Lucro/un','Ações'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{filtrados.map(p=>{
            const lucro = Number(p.preco_venda||0)-Number(p.preco_custo||0)
            return (
              <tr key={p.id}>
                <td style={s.td}><strong style={{color:t.text}}>{p.nome}</strong></td>
                <td style={s.td}><span style={{fontWeight:600,color:Number(p.quantidade)<=0?'#A32D2D':t.text}}>{p.quantidade}</span></td>
                <td style={s.td}>{fmt(p.preco_custo)}</td>
                <td style={s.td}><strong style={{color:t.text}}>{fmt(p.preco_venda)}</strong></td>
                <td style={s.td}><span style={{color:lucro>=0?'#3B6D11':'#A32D2D',fontWeight:500}}>{fmt(lucro)}</span></td>
                <td style={s.td}><div style={{display:'flex',gap:5}}>
                  <button style={s.btnSm} onClick={()=>{setEditForm({...p});setEditModal(p)}}>✏️ Editar</button>
                  <button style={{...s.btnSm,color:'#A32D2D',borderColor:'#FCEBEB'}} onClick={()=>apagar(p)}>🗑️</button>
                </div></td>
              </tr>
            )
          })}</tbody>
        </table>
        {filtrados.length===0&&<div style={{padding:24,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhum produto cadastrado.</div>}
      </div>

      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:t.bgCard,borderRadius:12,padding:24,width:440,maxWidth:'96vw',border:'1px solid '+t.border}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}><span>Novo produto</span><button style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:t.textSoft}} onClick={()=>setModal(false)}>×</button></div>
            <FG label="Nome do produto *" value={form.nome} onChange={v=>setForm({...form,nome:v})} t={t}/>
            <FG label="Quantidade em estoque" value={form.quantidade} onChange={v=>setForm({...form,quantidade:v})} t={t} type="number"/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <FG label="Preço de custo (R$)" value={form.preco_custo} onChange={v=>setForm({...form,preco_custo:v})} t={t} type="number"/>
              <FG label="Preço de venda (R$)" value={form.preco_venda} onChange={v=>setForm({...form,preco_venda:v})} t={t} type="number"/>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}><button style={s.btnSecondary} onClick={()=>setModal(false)}>Cancelar</button><button style={s.btnPrimary} onClick={salvar}>Salvar</button></div>
          </div>
        </div>
      )}
      {editModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:t.bgCard,borderRadius:12,padding:24,width:440,maxWidth:'96vw',border:'1px solid '+t.border}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}><span>Editar produto</span><button style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:t.textSoft}} onClick={()=>setEditModal(null)}>×</button></div>
            <FG label="Nome do produto *" value={editForm.nome} onChange={v=>setEditForm({...editForm,nome:v})} t={t}/>
            <FG label="Quantidade em estoque" value={editForm.quantidade} onChange={v=>setEditForm({...editForm,quantidade:v})} t={t} type="number"/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <FG label="Preço de custo (R$)" value={editForm.preco_custo} onChange={v=>setEditForm({...editForm,preco_custo:v})} t={t} type="number"/>
              <FG label="Preço de venda (R$)" value={editForm.preco_venda} onChange={v=>setEditForm({...editForm,preco_venda:v})} t={t} type="number"/>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}><button style={s.btnSecondary} onClick={()=>setEditModal(null)}>Cancelar</button><button style={s.btnPrimary} onClick={salvarEdicao}>Salvar alterações</button></div>
          </div>
        </div>
      )}
    </Layout>
  )
}
