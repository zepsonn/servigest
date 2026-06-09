import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { useRouter } from 'next/router'

function useIsMobile(){ const [m,setM]=useState(false); useEffect(()=>{const c=()=>setM(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);return m }

export default function Vendas() {
  const [produtos, setProdutos] = useState([])
  const [vendas, setVendas] = useState([])
  const [modal, setModal] = useState(false)
  const [carrinho, setCarrinho] = useState([])
  const [cliente, setCliente] = useState({nome:'',telefone:''})
  const [buscaProd, setBuscaProd] = useState('')
  const [detalhe, setDetalhe] = useState(null)
  const [detItens, setDetItens] = useState([])
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const router = useRouter()

  useEffect(()=>{
    const u=JSON.parse(localStorage.getItem('servigest_user')||'{}')
    if(u.role!=='gestor'){router.push('/dashboard');return}
    load()
  },[])

  async function load(){
    const [{data:prod},{data:vend}]=await Promise.all([
      supabase.from('produtos').select('*').order('nome'),
      supabase.from('vendas').select('*').order('criado_em',{ascending:false}),
    ])
    setProdutos(prod||[]); setVendas(vend||[])
  }

  function addProduto(p){
    if(Number(p.quantidade)<=0){alert('Produto sem estoque!');return}
    const existe=carrinho.find(i=>i.produto_id===p.id)
    if(existe){
      if(existe.qtd>=Number(p.quantidade)){alert('Estoque máximo atingido!');return}
      setCarrinho(carrinho.map(i=>i.produto_id===p.id?{...i,qtd:i.qtd+1}:i))
    } else {
      setCarrinho([...carrinho,{produto_id:p.id,nome:p.nome,qtd:1,preco_custo:Number(p.preco_custo),preco_venda:Number(p.preco_venda),estoque:Number(p.quantidade)}])
    }
  }
  function mudarQtd(id,delta){
    setCarrinho(carrinho.map(i=>{
      if(i.produto_id!==id)return i
      const nova=i.qtd+delta
      if(nova<1)return i
      if(nova>i.estoque){alert('Estoque insuficiente!');return i}
      return {...i,qtd:nova}
    }))
  }
  function removerItem(id){setCarrinho(carrinho.filter(i=>i.produto_id!==id))}

  const totalVenda=carrinho.reduce((s,i)=>s+i.preco_venda*i.qtd,0)
  const totalCusto=carrinho.reduce((s,i)=>s+i.preco_custo*i.qtd,0)
  const totalLucro=totalVenda-totalCusto

  async function finalizarVenda(){
    if(carrinho.length===0){alert('Adicione produtos');return}
    const{data:venda,error}=await supabase.from('vendas').insert([{cliente_nome:cliente.nome,cliente_telefone:cliente.telefone,total_venda:totalVenda,total_custo:totalCusto,total_lucro:totalLucro,data:new Date().toISOString().split('T')[0]}]).select().single()
    if(error){alert('Erro ao salvar venda');return}
    const itens=carrinho.map(i=>({venda_id:venda.id,produto_id:i.produto_id,produto_nome:i.nome,quantidade:i.qtd,preco_custo:i.preco_custo,preco_venda:i.preco_venda,subtotal:i.preco_venda*i.qtd}))
    await supabase.from('venda_itens').insert(itens)
    for(const i of carrinho){
      const prod=produtos.find(p=>p.id===i.produto_id)
      await supabase.from('produtos').update({quantidade:Number(prod.quantidade)-i.qtd}).eq('id',i.produto_id)
    }
    setModal(false); setCarrinho([]); setCliente({nome:'',telefone:''}); load()
    alert('Venda finalizada!')
  }

  async function verDetalhe(v){
    const{data}=await supabase.from('venda_itens').select('*').eq('venda_id',v.id)
    setDetItens(data||[]); setDetalhe(v)
  }
  async function apagarVenda(v){
    if(!confirm('Apagar venda #'+v.numero+'?'))return
    await supabase.from('vendas').delete().eq('id',v.id); load()
  }

  const fmt=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const prodFiltrados=produtos.filter(p=>p.nome.toLowerCase().includes(buscaProd.toLowerCase())||(p.codigo||'').toLowerCase().includes(buscaProd.toLowerCase()))
  const totalHoje=vendas.filter(v=>v.data===new Date().toISOString().split('T')[0]).reduce((s,v)=>s+Number(v.total_venda||0),0)
  const lucroHoje=vendas.filter(v=>v.data===new Date().toISOString().split('T')[0]).reduce((s,v)=>s+Number(v.total_lucro||0),0)

  const inp={width:'100%',padding:'9px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:14,fontFamily:'inherit',background:t.bgInput,color:t.text}

  return (
    <Layout title="Vendas de Peças">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
        <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'12px 14px'}}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Vendas hoje</div><div style={{fontSize:20,fontWeight:700,color:t.text}}>{fmt(totalHoje)}</div></div>
        <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'12px 14px'}}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Lucro hoje</div><div style={{fontSize:20,fontWeight:700,color:'#3B6D11'}}>{fmt(lucroHoje)}</div></div>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        <button style={{padding:'9px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500}} onClick={()=>setModal(true)}>+ Nova venda</button>
      </div>

      {/* LISTA DE VENDAS */}
      {isMobile?(
        <div>
          {vendas.map(v=>(
            <div key={v.id} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:14,marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                <div><div style={{fontWeight:600,color:t.text}}>#{v.numero} · {v.cliente_nome||'Avulso'}</div><div style={{fontSize:12,color:t.textSoft}}>{v.data?new Date(v.data+'T12:00').toLocaleDateString('pt-BR'):''}</div></div>
                <div style={{textAlign:'right'}}><div style={{fontWeight:700,color:t.text,fontSize:16}}>{fmt(v.total_venda)}</div><div style={{fontSize:12,color:'#3B6D11'}}>Lucro: {fmt(v.total_lucro)}</div></div>
              </div>
              <div style={{display:'flex',gap:6,marginTop:8}}>
                <button style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid '+t.border,background:t.bgCard,color:t.text,fontSize:12,cursor:'pointer'}} onClick={()=>verDetalhe(v)}>Ver detalhes</button>
                <button style={{padding:'8px 12px',borderRadius:8,border:'1px solid #FCEBEB',background:t.bgCard,color:'#A32D2D',fontSize:12,cursor:'pointer'}} onClick={()=>apagarVenda(v)}>🗑️</button>
              </div>
            </div>
          ))}
          {vendas.length===0&&<div style={{padding:32,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhuma venda.</div>}
        </div>
      ):(
        <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr>{['Nº','Cliente','Total','Lucro','Data','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 12px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft}}>{h}</th>)}</tr></thead>
            <tbody>{vendas.map(v=>(
              <tr key={v.id}>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>#{v.numero}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{v.cliente_nome||'Avulso'}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}><strong>{fmt(v.total_venda)}</strong></td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:'#3B6D11'}}>{fmt(v.total_lucro)}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text}}>{v.data?new Date(v.data+'T12:00').toLocaleDateString('pt-BR'):'—'}</td>
                <td style={{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft}}><div style={{display:'flex',gap:5}}>
                  <button style={{padding:'4px 10px',borderRadius:6,border:'1px solid '+t.border,fontSize:11,cursor:'pointer',background:t.bgCard,color:t.text}} onClick={()=>verDetalhe(v)}>👁</button>
                  <button style={{padding:'4px 10px',borderRadius:6,border:'1px solid #FCEBEB',fontSize:11,cursor:'pointer',background:t.bgCard,color:'#A32D2D'}} onClick={()=>apagarVenda(v)}>🗑️</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
          {vendas.length===0&&<div style={{padding:24,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhuma venda.</div>}
        </div>
      )}

      {/* MODAL NOVA VENDA */}
      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:isMobile?'flex-end':'center',justifyContent:'center'}}>
          <div style={{background:t.bgCard,borderRadius:isMobile?'16px 16px 0 0':12,padding:20,width:isMobile?'100%':780,maxWidth:'100vw',maxHeight:'94vh',overflow:'auto',border:'1px solid '+t.border}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}><span>Nova venda</span><button style={{background:'none',border:'none',fontSize:24,cursor:'pointer',color:t.textSoft}} onClick={()=>{setModal(false);setCarrinho([])}}>×</button></div>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:16}}>
              {/* PRODUTOS */}
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:t.textSoft,marginBottom:8}}>Produtos</div>
                <input style={{...inp,marginBottom:10}} placeholder="Buscar produto ou código..." value={buscaProd} onChange={e=>setBuscaProd(e.target.value)}/>
                <div style={{maxHeight:isMobile?200:320,overflow:'auto'}}>
                  {prodFiltrados.map(p=>(
                    <div key={p.id} onClick={()=>addProduto(p)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',borderRadius:8,border:'1px solid '+t.borderSoft,marginBottom:6,cursor:'pointer',background:t.bgSidebar}}>
                      <div><div style={{fontWeight:500,color:t.text,fontSize:13}}>{p.nome}</div><div style={{fontSize:11,color:t.textSoft}}>Estoque: {p.quantidade} {p.codigo?'· Cód: '+p.codigo:''}</div></div>
                      <div style={{textAlign:'right'}}><div style={{fontWeight:600,color:t.accent}}>{fmt(p.preco_venda)}</div><div style={{fontSize:18,color:t.accent,fontWeight:700}}>+</div></div>
                    </div>
                  ))}
                </div>
              </div>
              {/* CARRINHO */}
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:t.textSoft,marginBottom:8}}>Carrinho</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                  <input style={inp} placeholder="Nome do cliente" value={cliente.nome} onChange={e=>setCliente({...cliente,nome:e.target.value})}/>
                  <input style={inp} placeholder="Telefone" value={cliente.telefone} onChange={e=>setCliente({...cliente,telefone:e.target.value})}/>
                </div>
                <div style={{maxHeight:isMobile?150:200,overflow:'auto',marginBottom:12}}>
                  {carrinho.length===0&&<div style={{fontSize:12,color:t.textSoft,textAlign:'center',padding:20,border:'1px dashed '+t.border,borderRadius:8}}>Clique nos produtos para adicionar</div>}
                  {carrinho.map(i=>(
                    <div key={i.produto_id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid '+t.borderSoft}}>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:t.text}}>{i.nome}</div></div>
                      <button style={{padding:'2px 10px',borderRadius:6,border:'1px solid '+t.border,background:t.bgCard,color:t.text,fontSize:16,cursor:'pointer'}} onClick={()=>mudarQtd(i.produto_id,-1)}>−</button>
                      <span style={{minWidth:24,textAlign:'center',fontWeight:600,color:t.text}}>{i.qtd}</span>
                      <button style={{padding:'2px 10px',borderRadius:6,border:'1px solid '+t.border,background:t.bgCard,color:t.text,fontSize:16,cursor:'pointer'}} onClick={()=>mudarQtd(i.produto_id,1)}>+</button>
                      <span style={{minWidth:70,textAlign:'right',fontWeight:600,color:t.text,fontSize:13}}>{fmt(i.preco_venda*i.qtd)}</span>
                      <button style={{padding:'2px 8px',borderRadius:6,border:'none',background:'transparent',color:'#A32D2D',fontSize:18,cursor:'pointer'}} onClick={()=>removerItem(i.produto_id)}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{background:t.bgSidebar,borderRadius:8,padding:'12px 14px',marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4,color:t.textSoft}}><span>Custo</span><span>{fmt(totalCusto)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6,color:'#3B6D11'}}><span>Lucro</span><span>{fmt(totalLucro)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:20,fontWeight:700,color:t.text,borderTop:'1px solid '+t.border,paddingTop:8}}><span>Total</span><span>{fmt(totalVenda)}</span></div>
                </div>
                <button style={{width:'100%',padding:'12px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:14,cursor:'pointer',fontWeight:600}} onClick={finalizarVenda}>Finalizar venda</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHE */}
      {detalhe&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:isMobile?'flex-end':'center',justifyContent:'center'}}>
          <div style={{background:t.bgCard,borderRadius:isMobile?'16px 16px 0 0':12,padding:20,width:isMobile?'100%':480,maxWidth:'100vw',border:'1px solid '+t.border}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}><span>Venda #{detalhe.numero}</span><button style={{background:'none',border:'none',fontSize:24,cursor:'pointer',color:t.textSoft}} onClick={()=>setDetalhe(null)}>×</button></div>
            <div style={{fontSize:13,color:t.textSoft,marginBottom:12}}>{detalhe.cliente_nome||'Avulso'} {detalhe.data?'· '+new Date(detalhe.data+'T12:00').toLocaleDateString('pt-BR'):''}</div>
            {detItens.map(it=>(
              <div key={it.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid '+t.borderSoft,fontSize:13,color:t.text}}>
                <span>{it.quantidade}x {it.produto_nome}</span><span style={{fontWeight:500}}>{fmt(it.subtotal)}</span>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',fontSize:18,fontWeight:700,marginTop:12,color:t.text}}><span>Total</span><span>{fmt(detalhe.total_venda)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'#3B6D11',marginTop:4}}><span>Lucro</span><span>{fmt(detalhe.total_lucro)}</span></div>
          </div>
        </div>
      )}
    </Layout>
  )
}
