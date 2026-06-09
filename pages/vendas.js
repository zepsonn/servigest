import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { useRouter } from 'next/router'

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
  const router = useRouter()

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    if(u.role !== 'gestor') { router.push('/dashboard'); return }
    load()
  },[])

  async function load() {
    const [{ data: prod }, { data: vend }] = await Promise.all([
      supabase.from('produtos').select('*').order('nome'),
      supabase.from('vendas').select('*').order('criado_em',{ascending:false}),
    ])
    setProdutos(prod||[]); setVendas(vend||[])
  }

  function addProduto(p) {
    if (Number(p.quantidade) <= 0) { alert('Produto sem estoque!'); return }
    const existe = carrinho.find(i=>i.produto_id===p.id)
    if (existe) {
      if (existe.qtd >= Number(p.quantidade)) { alert('Quantidade máxima em estoque atingida!'); return }
      setCarrinho(carrinho.map(i=>i.produto_id===p.id?{...i,qtd:i.qtd+1}:i))
    } else {
      setCarrinho([...carrinho,{produto_id:p.id,nome:p.nome,qtd:1,preco_custo:Number(p.preco_custo),preco_venda:Number(p.preco_venda),estoque:Number(p.quantidade)}])
    }
  }
  function mudarQtd(id,delta) {
    setCarrinho(carrinho.map(i=>{
      if(i.produto_id!==id) return i
      const nova = i.qtd+delta
      if(nova<1) return i
      if(nova>i.estoque){ alert('Estoque insuficiente!'); return i }
      return {...i,qtd:nova}
    }))
  }
  function removerItem(id){ setCarrinho(carrinho.filter(i=>i.produto_id!==id)) }

  const totalVenda = carrinho.reduce((s,i)=>s+i.preco_venda*i.qtd,0)
  const totalCusto = carrinho.reduce((s,i)=>s+i.preco_custo*i.qtd,0)
  const totalLucro = totalVenda-totalCusto

  async function finalizarVenda() {
    if(carrinho.length===0){ alert('Adicione produtos'); return }
    // 1) cria a venda
    const { data: venda, error } = await supabase.from('vendas').insert([{
      cliente_nome:cliente.nome, cliente_telefone:cliente.telefone,
      total_venda:totalVenda, total_custo:totalCusto, total_lucro:totalLucro,
      data:new Date().toISOString().split('T')[0],
    }]).select().single()
    if(error){ alert('Erro ao salvar venda'); return }
    // 2) cria os itens
    const itens = carrinho.map(i=>({venda_id:venda.id,produto_id:i.produto_id,produto_nome:i.nome,quantidade:i.qtd,preco_custo:i.preco_custo,preco_venda:i.preco_venda,subtotal:i.preco_venda*i.qtd}))
    await supabase.from('venda_itens').insert(itens)
    // 3) baixa no estoque
    for(const i of carrinho){
      const prod = produtos.find(p=>p.id===i.produto_id)
      await supabase.from('produtos').update({quantidade:Number(prod.quantidade)-i.qtd}).eq('id',i.produto_id)
    }
    setModal(false); setCarrinho([]); setCliente({nome:'',telefone:''}); load()
    alert('Venda finalizada! Estoque atualizado.')
  }

  async function verDetalhe(v) {
    const { data } = await supabase.from('venda_itens').select('*').eq('venda_id',v.id)
    setDetItens(data||[]); setDetalhe(v)
  }
  async function apagarVenda(v) {
    if(!confirm('Apagar venda #'+v.numero+'? (o estoque NÃO será devolvido)')) return
    await supabase.from('vendas').delete().eq('id',v.id); load()
  }

  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const prodFiltrados = produtos.filter(p=>p.nome.toLowerCase().includes(buscaProd.toLowerCase()))
  const totalVendasHoje = vendas.filter(v=>v.data===new Date().toISOString().split('T')[0]).reduce((s,v)=>s+Number(v.total_venda||0),0)
  const lucroHoje = vendas.filter(v=>v.data===new Date().toISOString().split('T')[0]).reduce((s,v)=>s+Number(v.total_lucro||0),0)

  const s = {
    grid2:{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:20},
    stat:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'14px 16px'},
    card:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,overflow:'hidden'},
    table:{width:'100%',borderCollapse:'collapse',fontSize:13},
    th:{textAlign:'left',padding:'8px 12px',color:t.textSoft,fontWeight:500,fontSize:11,background:t.bgSidebar,borderBottom:'1px solid '+t.borderSoft},
    td:{padding:'9px 12px',borderBottom:'1px solid '+t.borderSoft,color:t.text},
    btnSm:{padding:'4px 10px',borderRadius:6,border:'1px solid '+t.border,fontSize:11,cursor:'pointer',background:t.bgCard,fontFamily:'inherit',color:t.text},
    btnPrimary:{padding:'7px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500,fontFamily:'inherit'},
    btnSecondary:{padding:'7px 14px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:13,cursor:'pointer',fontFamily:'inherit'},
    inp:{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit',background:t.bgInput,color:t.text},
    prodItem:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',borderRadius:8,border:'1px solid '+t.borderSoft,marginBottom:6,cursor:'pointer',background:t.bgSidebar},
  }

  return (
    <Layout title="Vendas de Peças">
      <div style={s.grid2}>
        <div style={s.stat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Vendas de peças hoje</div><div style={{fontSize:22,fontWeight:700,color:t.text}}>{fmt(totalVendasHoje)}</div></div>
        <div style={s.stat}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Lucro em peças hoje</div><div style={{fontSize:22,fontWeight:700,color:'#3B6D11'}}>{fmt(lucroHoje)}</div></div>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button style={s.btnPrimary} onClick={()=>setModal(true)}>+ Nova venda</button>
      </div>
      <div style={s.card}>
        <table style={s.table}>
          <thead><tr>{['Nº','Cliente','Total','Lucro','Data','Ações'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{vendas.map(v=>(
            <tr key={v.id}>
              <td style={s.td}><strong style={{color:t.text}}>#{v.numero}</strong></td>
              <td style={s.td}>{v.cliente_nome||'Cliente avulso'}</td>
              <td style={s.td}><strong style={{color:t.text}}>{fmt(v.total_venda)}</strong></td>
              <td style={s.td}><span style={{color:'#3B6D11',fontWeight:500}}>{fmt(v.total_lucro)}</span></td>
              <td style={s.td}>{v.data?new Date(v.data+'T12:00').toLocaleDateString('pt-BR'):'—'}</td>
              <td style={s.td}><div style={{display:'flex',gap:5}}>
                <button style={s.btnSm} onClick={()=>verDetalhe(v)}>👁 Ver</button>
                <button style={{...s.btnSm,color:'#A32D2D',borderColor:'#FCEBEB'}} onClick={()=>apagarVenda(v)}>🗑️</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
        {vendas.length===0&&<div style={{padding:24,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhuma venda registrada.</div>}
      </div>

      {/* MODAL NOVA VENDA */}
      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:t.bgCard,borderRadius:12,padding:24,width:760,maxWidth:'96vw',maxHeight:'92vh',overflow:'auto',border:'1px solid '+t.border}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}><span>Nova venda</span><button style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:t.textSoft}} onClick={()=>{setModal(false);setCarrinho([])}}>×</button></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              {/* ESQUERDA: produtos */}
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:t.textSoft,marginBottom:8}}>Produtos disponíveis</div>
                <input style={{...s.inp,marginBottom:10}} placeholder="Buscar produto..." value={buscaProd} onChange={e=>setBuscaProd(e.target.value)}/>
                <div style={{maxHeight:340,overflow:'auto'}}>
                  {prodFiltrados.map(p=>(
                    <div key={p.id} style={s.prodItem} onClick={()=>addProduto(p)}>
                      <div><div style={{fontWeight:500,color:t.text}}>{p.nome}</div><div style={{fontSize:11,color:t.textSoft}}>Estoque: {p.quantidade} · {fmt(p.preco_venda)}</div></div>
                      <span style={{color:t.accent,fontWeight:700,fontSize:18}}>+</span>
                    </div>
                  ))}
                  {prodFiltrados.length===0&&<div style={{fontSize:12,color:t.textSoft,textAlign:'center',padding:16}}>Nenhum produto.</div>}
                </div>
              </div>
              {/* DIREITA: carrinho */}
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:t.textSoft,marginBottom:8}}>Itens da venda</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                  <input style={s.inp} placeholder="Nome do cliente" value={cliente.nome} onChange={e=>setCliente({...cliente,nome:e.target.value})}/>
                  <input style={s.inp} placeholder="Telefone" value={cliente.telefone} onChange={e=>setCliente({...cliente,telefone:e.target.value})}/>
                </div>
                <div style={{maxHeight:230,overflow:'auto',marginBottom:12}}>
                  {carrinho.length===0&&<div style={{fontSize:12,color:t.textSoft,textAlign:'center',padding:20,border:'1px dashed '+t.border,borderRadius:8}}>Clique nos produtos para adicionar</div>}
                  {carrinho.map(i=>(
                    <div key={i.produto_id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid '+t.borderSoft}}>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:t.text}}>{i.nome}</div><div style={{fontSize:11,color:t.textSoft}}>{fmt(i.preco_venda)} cada</div></div>
                      <button style={{...s.btnSm,padding:'2px 8px'}} onClick={()=>mudarQtd(i.produto_id,-1)}>−</button>
                      <span style={{minWidth:24,textAlign:'center',fontWeight:600,color:t.text}}>{i.qtd}</span>
                      <button style={{...s.btnSm,padding:'2px 8px'}} onClick={()=>mudarQtd(i.produto_id,1)}>+</button>
                      <span style={{minWidth:70,textAlign:'right',fontWeight:600,color:t.text}}>{fmt(i.preco_venda*i.qtd)}</span>
                      <button style={{...s.btnSm,padding:'2px 6px',color:'#A32D2D',border:'none'}} onClick={()=>removerItem(i.produto_id)}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{background:t.bgSidebar,borderRadius:8,padding:'12px 14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4,color:t.textSoft}}><span>Custo</span><span>{fmt(totalCusto)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4,color:'#3B6D11'}}><span>Lucro</span><span>{fmt(totalLucro)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:18,fontWeight:700,color:t.text,borderTop:'1px solid '+t.border,paddingTop:8,marginTop:4}}><span>Total</span><span>{fmt(totalVenda)}</span></div>
                </div>
                <button style={{...s.btnPrimary,width:'100%',marginTop:12,padding:'10px'}} onClick={finalizarVenda}>Finalizar venda e baixar estoque</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHE */}
      {detalhe&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:t.bgCard,borderRadius:12,padding:24,width:480,maxWidth:'96vw',border:'1px solid '+t.border}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}><span>Venda #{detalhe.numero}</span><button style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:t.textSoft}} onClick={()=>setDetalhe(null)}>×</button></div>
            <div style={{fontSize:13,color:t.textSoft,marginBottom:12}}>Cliente: {detalhe.cliente_nome||'Avulso'} {detalhe.cliente_telefone?'· '+detalhe.cliente_telefone:''}</div>
            {detItens.map(it=>(
              <div key={it.id} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid '+t.borderSoft,fontSize:13,color:t.text}}>
                <span>{it.quantidade}x {it.produto_nome}</span><span style={{fontWeight:500}}>{fmt(it.subtotal)}</span>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:700,marginTop:12,color:t.text}}><span>Total</span><span>{fmt(detalhe.total_venda)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'#3B6D11',marginTop:4}}><span>Lucro</span><span>{fmt(detalhe.total_lucro)}</span></div>
          </div>
        </div>
      )}
    </Layout>
  )
}
