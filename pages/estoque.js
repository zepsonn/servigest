import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme, grad, GRADIENTES } from '../lib/theme'
import { useRouter } from 'next/router'
import { Ico, BotaoIco, BotaoPill } from '../lib/icones'

function useIsMobile(){ const [m,setM]=useState(false); useEffect(()=>{const c=()=>setM(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);return m }

function FG({label,value,onChange,t,type}){
  const st={width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit',background:t.bgInput,color:t.text}
  return <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}}>{label}</label><input type={type||'text'} style={st} value={value} onChange={e=>onChange(e.target.value)}/></div>
}

export default function Estoque() {
  const [produtos, setProdutos] = useState([])
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({nome:'',codigo:'',quantidade:0,preco_custo:0,preco_venda:0})
  const [editForm, setEditForm] = useState({})
  const { t } = useTheme()
  const isMobile = useIsMobile()
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
    await supabase.from('produtos').insert([{nome:form.nome,codigo:form.codigo,quantidade:Number(form.quantidade)||0,preco_custo:Number(form.preco_custo)||0,preco_venda:Number(form.preco_venda)||0}])
    setModal(false); setForm({nome:'',codigo:'',quantidade:0,preco_custo:0,preco_venda:0}); load()
  }
  async function salvarEdicao() {
    await supabase.from('produtos').update({nome:editForm.nome,codigo:editForm.codigo,quantidade:Number(editForm.quantidade)||0,preco_custo:Number(editForm.preco_custo)||0,preco_venda:Number(editForm.preco_venda)||0}).eq('id',editModal.id)
    setEditModal(null); load()
  }
  async function apagar(p) {
    if(!confirm('Apagar "'+p.nome+'"?')) return
    await supabase.from('produtos').delete().eq('id',p.id); load()
  }

  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const filtrados = produtos
    .filter(p=>p.nome.toLowerCase().includes(busca.toLowerCase())||(p.codigo||'').toLowerCase().includes(busca.toLowerCase()))
    .sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'))
  const valorEstoque = produtos.reduce((s,p)=>s+Number(p.preco_custo||0)*Number(p.quantidade||0),0)
  const itensTotal = produtos.reduce((s,p)=>s+Number(p.quantidade||0),0)
  const semEstoque = produtos.filter(p=>Number(p.quantidade||0)<=0).length

  const s = {
    grid3:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20},
    stat:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:16,boxShadow:t.shadow,padding:'14px 16px'},
    toolbar:{display:'flex',gap:8,marginBottom:16},
    search:{flex:1,padding:'8px 14px',borderRadius:8,border:'1px solid '+t.border,background:t.bgInput,fontSize:13,fontFamily:'inherit',color:t.text},
    card:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:16,boxShadow:t.shadow,overflow:'hidden'},
    table:{width:'100%',borderCollapse:'collapse',fontSize:13},
    th:{textAlign:'left',padding:'8px 12px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft},
    td:{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text},
    btnSm:{padding:'4px 10px',borderRadius:6,border:'1px solid '+t.border,fontSize:11,cursor:'pointer',background:t.bgCard,fontFamily:'inherit',color:t.text},
    btnPrimary:{padding:'7px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500,fontFamily:'inherit'},
    btnSecondary:{padding:'7px 14px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:13,cursor:'pointer',fontFamily:'inherit'},
    inp:{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit',background:t.bgInput,color:t.text},
  }

  return (
    <Layout title="Estoque">
      <div style={s.grid3}>
        <div style={s.stat}><div style={{fontSize:10,color:t.textSoft,marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>Itens em estoque</div><div style={{fontSize:24,fontWeight:700,fontVariantNumeric:'tabular-nums',color:t.text}}>{itensTotal}</div></div>
        <div style={s.stat}><div style={{fontSize:10,color:t.textSoft,marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>Valor investido (custo)</div><div style={{fontSize:24,fontWeight:700,fontVariantNumeric:'tabular-nums',color:t.text}}>{fmt(valorEstoque)}</div></div>
        <div style={s.stat}><div style={{fontSize:10,color:t.textSoft,marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>Produtos sem estoque</div><div style={{fontSize:24,fontWeight:700,fontVariantNumeric:'tabular-nums',color:semEstoque>0?'#A32D2D':t.text}}>{semEstoque}</div></div>
      </div>
      <div style={s.toolbar}>
        <div style={{flex:1,display:'flex',alignItems:'center',gap:8,background:t.bgInput,border:'1px solid '+t.border,borderRadius:999,padding:'0 16px',height:44,color:t.textSoft}}>
          <Ico n="busca" size={16}/>
          <input style={{flex:1,border:'none',background:'transparent',outline:'none',fontSize:13.5,fontFamily:'inherit',color:t.text}}
            placeholder="Buscar produto ou código..." value={busca} onChange={e=>setBusca(e.target.value)}/>
        </div>
        <BotaoPill n="mais" t={t} onClick={()=>setModal(true)}
          style={{background:grad('estoque'),color:'#fff',border:'none',height:44,boxShadow:'0 8px 18px -6px '+GRADIENTES.estoque[1]+'99'}}>
          {isMobile?'Novo':'Novo produto'}
        </BotaoPill>
      </div>
      {/* ---------- CELULAR: cards (tabela nao cabe na tela) ---------- */}
      {isMobile?(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtrados.map(p=>{
            const lucro=Number(p.preco_venda||0)-Number(p.preco_custo||0)
            const qtd=Number(p.quantidade||0)
            const semEst=qtd<=0
            return (
              <div key={p.id} className="sg-card" style={{background:t.bgCard,border:'1px solid '+(semEst?'#f0cccc':t.border),borderRadius:16,boxShadow:t.shadow,padding:'13px 14px'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:11}}>
                  <div style={{width:44,height:44,borderRadius:13,flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                               background:semEst?'#fdeaea':grad('estoque'),color:semEst?'#C24141':'#fff',
                               boxShadow:semEst?'none':'0 6px 14px -5px '+GRADIENTES.estoque[1]+'99'}}>
                    <span style={{fontSize:16,fontWeight:800,lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{qtd}</span>
                    <span style={{fontSize:8,opacity:.85,letterSpacing:'.04em'}}>UN</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,color:t.text,lineHeight:1.3}}>{p.nome}</div>
                    {p.codigo&&<div style={{fontSize:11,color:t.textSoft,marginTop:3,fontFamily:'ui-monospace,monospace'}}>{p.codigo}</div>}
                  </div>
                </div>
                <div style={{display:'flex',gap:8,marginTop:11,alignItems:'center'}}>
                  <div style={{flex:1,display:'flex',gap:14}}>
                    <div><div style={{fontSize:9.5,color:t.textSoft,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>Custo</div>
                      <div style={{fontSize:13,color:t.text,fontVariantNumeric:'tabular-nums'}}>{fmt(p.preco_custo)}</div></div>
                    <div><div style={{fontSize:9.5,color:t.textSoft,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>Venda</div>
                      <div style={{fontSize:13,fontWeight:700,color:t.text,fontVariantNumeric:'tabular-nums'}}>{fmt(p.preco_venda)}</div></div>
                    <div><div style={{fontSize:9.5,color:t.textSoft,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>Lucro</div>
                      <div style={{fontSize:13,fontWeight:700,color:lucro>0?'#2E7A3E':lucro<0?'#C24141':t.textSoft,fontVariantNumeric:'tabular-nums'}}>{fmt(lucro)}</div></div>
                  </div>
                  <BotaoIco n="editar" t={t} size={38} titulo="Editar produto" onClick={()=>{setEditForm({...p,codigo:p.codigo||''});setEditModal(p)}}/>
                  <BotaoIco n="apagar" t={t} size={38} tom="perigo" titulo="Apagar produto" onClick={()=>apagar(p)}/>
                </div>
              </div>
            )
          })}
          {filtrados.length===0&&<div style={{padding:28,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhum produto encontrado.</div>}
        </div>
      ):(
      <div style={s.card}>
        <div style={{overflowX:'auto'}}>
        <table style={s.table}>
          <thead><tr>{['Código','Produto','Qtd','Custo','Venda','Lucro/un','Ações'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{filtrados.map(p=>{
            const lucro = Number(p.preco_venda||0)-Number(p.preco_custo||0)
            return (
              <tr key={p.id}>
                <td style={s.td}><code style={{fontSize:11,background:t.bgSidebar,padding:'2px 6px',borderRadius:4,color:t.textSoft}}>{p.codigo||'—'}</code></td>
                <td style={s.td}><strong style={{color:t.text}}>{p.nome}</strong></td>
                <td style={s.td}><span style={{fontWeight:700,fontVariantNumeric:'tabular-nums',color:Number(p.quantidade)<=0?'#C24141':t.text}}>{p.quantidade}</span></td>
                <td style={s.td}><span style={{fontVariantNumeric:'tabular-nums'}}>{fmt(p.preco_custo)}</span></td>
                <td style={s.td}><strong style={{color:t.text,fontVariantNumeric:'tabular-nums'}}>{fmt(p.preco_venda)}</strong></td>
                <td style={s.td}><span style={{color:lucro>=0?'#2E7A3E':'#C24141',fontWeight:600,fontVariantNumeric:'tabular-nums'}}>{fmt(lucro)}</span></td>
                <td style={s.td}><div style={{display:'flex',gap:6}}>
                  <BotaoIco n="editar" t={t} size={34} titulo="Editar produto" onClick={()=>{setEditForm({...p,codigo:p.codigo||''});setEditModal(p)}}/>
                  <BotaoIco n="apagar" t={t} size={34} tom="perigo" titulo="Apagar produto" onClick={()=>apagar(p)}/>
                </div></td>
              </tr>
            )
          })}</tbody>
        </table>
        </div>
        {filtrados.length===0&&<div style={{padding:24,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhum produto encontrado.</div>}
      </div>
      )}

      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:t.bgCard,borderRadius:12,padding:24,width:440,maxWidth:'96vw',border:'1px solid '+t.border}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}><span>Novo produto</span><button style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:t.textSoft}} onClick={()=>setModal(false)}>×</button></div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
              <FG label="Nome do produto *" value={form.nome} onChange={v=>setForm({...form,nome:v})} t={t}/>
              <FG label="Código" value={form.codigo} onChange={v=>setForm({...form,codigo:v})} t={t}/>
            </div>
            <FG label="Quantidade em estoque" value={form.quantidade} onChange={v=>setForm({...form,quantidade:v})} t={t} type="number"/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <FG label="Preço de custo (R$)" value={form.preco_custo} onChange={v=>setForm({...form,preco_custo:v})} t={t} type="number"/>
              <FG label="Preço de venda (R$)" value={form.preco_venda} onChange={v=>setForm({...form,preco_venda:v})} t={t} type="number"/>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}><button style={s.btnSecondary} onClick={()=>setModal(false)}>Cancelar</button><button style={s.btnPrimary} onClick={salvar}>Salvar</button></div>
          </div>
        </div>
      )}

      {editModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:t.bgCard,borderRadius:12,padding:24,width:440,maxWidth:'96vw',border:'1px solid '+t.border}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}><span>Editar — {editModal.nome}</span><button style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:t.textSoft}} onClick={()=>setEditModal(null)}>×</button></div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
              <FG label="Nome do produto *" value={editForm.nome} onChange={v=>setEditForm({...editForm,nome:v})} t={t}/>
              <FG label="Código" value={editForm.codigo||''} onChange={v=>setEditForm({...editForm,codigo:v})} t={t}/>
            </div>
            <FG label="Quantidade em estoque" value={editForm.quantidade} onChange={v=>setEditForm({...editForm,quantidade:v})} t={t} type="number"/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <FG label="Preço de custo (R$)" value={editForm.preco_custo} onChange={v=>setEditForm({...editForm,preco_custo:v})} t={t} type="number"/>
              <FG label="Preço de venda (R$)" value={editForm.preco_venda} onChange={v=>setEditForm({...editForm,preco_venda:v})} t={t} type="number"/>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}><button style={s.btnSecondary} onClick={()=>setEditModal(null)}>Cancelar</button><button style={s.btnPrimary} onClick={salvarEdicao}>Salvar alterações</button></div>
          </div>
        </div>
      )}
    </Layout>
  )
}
