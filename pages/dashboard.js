// atualizado 2026-06-15 15:49
import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme, GRADIENTES, grad } from '../lib/theme'
import { Ico, BotaoIco, BotaoPill } from '../lib/icones'
import { copiarOS } from '../lib/whatsapp'
import PainelConfirmar from '../components/PainelConfirmar'
import Link from 'next/link'

function useIsMobile(){ const [m,setM]=useState(false); useEffect(()=>{const c=()=>setM(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);return m }
const badgeColors={em_andamento:['#FAEEDA','#854F0B'],concluido:['#EAF3DE','#3B6D11'],concluida:['#EAF3DE','#3B6D11']}
function Badge({s}){const[bg,c]=badgeColors[s]||['#F1EFE8','#5F5E5A'];return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{(s||'').replace('_',' ')}</span>}

// Dashboard mostra so ENTRADA. Despesas e Lucro sairam daqui a pedido —
// os dados continuam intactos no banco e na tela de Despesas.
const CARDS_DEFAULT = [
  {id:'faturamento',label:'Faturamento',tamanho:'medio'},
  {id:'ticket',label:'Ticket médio',tamanho:'medio'},
  {id:'clientes',label:'Clientes ativos',tamanho:'pequeno'},
  {id:'andamento',label:'Em andamento',tamanho:'pequeno'},
  {id:'concluidas',label:'Concluídas',tamanho:'pequeno'},
  {id:'hoje',label:'Agenda hoje',tamanho:'pequeno'},
  {id:'aguardando_peca',label:'Aguardando peça',tamanho:'medio'},
  {id:'calendario',label:'Calendário de serviços',tamanho:'largo'},
  {id:'localizacao',label:'Localização dos técnicos',tamanho:'medio'},
  {id:'agenda',label:'Agenda de serviços',tamanho:'largo'},
  {id:'por_tecnico',label:'Serviços por técnico hoje',tamanho:'largo'},
  {id:'grafico',label:'Receita por mês',tamanho:'largo'},
  {id:'comissoes',label:'Comissões técnicos',tamanho:'medio'},
  {id:'comissoes_dia',label:'Comissões por dia',tamanho:'medio'},
]

function loadConfig(){
  try{
    const c=JSON.parse(localStorage.getItem('db_cfg2'))
    if(!c||!c.length) return CARDS_DEFAULT
    // tira cards que nao existem mais (ex: despesas/lucro)
    const validos=c.filter(x=>CARDS_DEFAULT.some(d=>d.id===x.id))
    // acrescenta cards novos que ainda nao existiam na config salva
    const faltando=CARDS_DEFAULT.filter(d=>!validos.find(x=>x.id===d.id))
    return faltando.length?[...validos,...faltando]:validos
  }
  catch{ return CARDS_DEFAULT }
}
function saveConfig(c){ localStorage.setItem('db_cfg2',JSON.stringify(c)) }

const PERIODOS = {manha:'Manhã',tarde:'Tarde',noite:'Noite'}

export default function Dashboard(){
  const [user,setUser]=useState(null)
  const [stats,setStats]=useState({clientes:0,hoje:0,andamento:0,concluidas:0,fat:0,desp:0,meses:[]})
  const [osHoje,setOsHoje]=useState([])
  const [osFuturas,setOsFuturas]=useState([])
  const [osRealizadas,setOsRealizadas]=useState([])
  const [agendaFiltroData,setAgendaFiltroData]=useState('')
  const [osFiltradas,setOsFiltradas]=useState([])
  // calendario
  const [calMes,setCalMes]=useState(()=>new Date().toISOString().slice(0,7))
  const [calDias,setCalDias]=useState({})
  const [calSel,setCalSel]=useState(()=>new Date().toISOString().split('T')[0])
  const [calCarregando,setCalCarregando]=useState(false)
  const [tecFiltroId,setTecFiltroId]=useState('')
  const [tecFiltroData,setTecFiltroData]=useState(new Date().toISOString().split('T')[0])
  const [tecOs,setTecOs]=useState([])
  const [tecBuscando,setTecBuscando]=useState(false)
  const [buscandoFiltro,setBuscandoFiltro]=useState(false)
  const [config,setConfig]=useState(CARDS_DEFAULT)
  const [draft,setDraft]=useState(CARDS_DEFAULT)
  const [editando,setEditando]=useState(false)
  const [dragIdx,setDragIdx]=useState(null)
  const [overIdx,setOverIdx]=useState(null)
  const {t}=useTheme()
  const isMobile=useIsMobile()

  useEffect(()=>{
    const u=JSON.parse(localStorage.getItem('servigest_user')||'{}')
    setUser(u); loadData(u)
    const c=loadConfig(); setConfig(c); setDraft([...c])
    // carregar tecnicos e comissoes
    supabase.from('usuarios').select('id,nome,comissao_percentual').eq('ativo',true).then(({data})=>{
      if(data){
        setTecnicos(data)
        const map={}; data.forEach(t=>{map[t.id]=t.comissao_percentual||0}); setComissoes(map)
      }
    })
    // calendario do mes atual
    carregarMes(new Date().toISOString().slice(0,7))
    // OS esperando peca chegar
    supabase.from('ordens_servico')
      .select('id,numero,cliente_nome,produto,peca_pedida,valor,valor_sinal,data_sinal')
      .eq('status','aguardando_peca').order('data_sinal')
      .then(({data})=>setEsperandoPeca(data||[]))
    // ultima localizacao de cada tecnico — so o gestor carrega isso
    if(u.role==='gestor'){
      supabase.from('localizacoes_tecnico').select('tecnico_id,lat,lng,criado_em')
        .order('criado_em',{ascending:false}).limit(400).then(({data})=>{
          if(!data) return
          const m={}; data.forEach(l=>{ if(!m[l.tecnico_id]) m[l.tecnico_id]=l })
          setLocais(m)
        })
    }
  },[])

  async function loadData(u){
    const hoje=new Date().toISOString().split('T')[0]
    const em7dias=new Date(Date.now()+7*24*60*60*1000).toISOString().split('T')[0]
    if(u.role==='gestor'){
      const [{count:cl},{data:os},{data:osComissao},{data:desp},{data:proximas}]=await Promise.all([
        supabase.from('clientes').select('*',{count:'exact',head:true}).eq('ativo',true),
        supabase.from('ordens_servico').select('valor,status,data_entrada,data_conclusao'),
        supabase.from('ordens_servico').select('valor,valor_mao_obra,valor_pecas,valor_taxa,eh_taxa,tecnico_id,data_conclusao,usuarios(nome,comissao_percentual)').eq('status','concluida'),
        supabase.from('despesas').select('valor'),
        supabase.from('ordens_servico').select('id,numero,cliente_nome,cliente_telefone,cliente_endereco,bairro,produto,servico,descricao,relato_cliente,periodo,status,data_entrada,valor,observacoes,tecnico_id,usuarios(nome,comissao_percentual)')
          .eq('status','em_andamento')
          .lte('data_entrada',em7dias)
          .order('data_entrada'),
      ])
      const concl=(os||[]).filter(o=>o.status==='concluida')
      const andamento=(os||[]).filter(o=>o.status==='em_andamento').length
      const desp2=(desp||[]).reduce((s,d)=>s+Number(d.valor||0),0)
      // separar hoje e futuras
      const todosProx = proximas||[]
      setOsHoje(todosProx.filter(o=>o.data_entrada===hoje))
      setOsFuturas(todosProx.filter(o=>o.data_entrada>hoje))
      const hojeCount=todosProx.filter(o=>o.data_entrada===hoje).length

      // calcular comissoes por tecnico + descobrir qual taxa de cada tecnico/dia foi a 1a
      const comMap={}
      const porDia={} // {data: {tecnico: {empresa, tecnicoValor}}}
      let fat=0
      const ordenadas=[...(osComissao||[])].sort((a,b)=>(a.data_conclusao||'').localeCompare(b.data_conclusao||''))
      const contadorTaxaDia={} // chave: tecnico_id+data -> quantidade de taxas ja processadas

      ordenadas.forEach(o=>{
        const nome=o.usuarios?.nome; const pct=o.usuarios?.comissao_percentual||0
        const dia=o.data_conclusao||''
        if(!porDia[dia]) porDia[dia]={}
        if(nome&&!porDia[dia][nome]) porDia[dia][nome]={empresa:0,tecnico:0}

        if(o.eh_taxa){
          const valorTaxa=Number(o.valor_taxa||o.valor||0)
          if(pct===0){
            // Claudio - 100% empresa
            fat+=valorTaxa
            if(nome) porDia[dia][nome].empresa+=valorTaxa
          } else {
            const chave=(o.tecnico_id||'')+'|'+dia
            contadorTaxaDia[chave]=(contadorTaxaDia[chave]||0)+1
            const ePrimeira=contadorTaxaDia[chave]===1
            if(ePrimeira){
              fat+=valorTaxa
              if(nome) porDia[dia][nome].empresa+=valorTaxa
            } else {
              const metade=valorTaxa/2
              fat+=metade
              if(nome){
                porDia[dia][nome].empresa+=metade
                porDia[dia][nome].tecnico+=metade
              }
              if(!comMap[nome])comMap[nome]={nome,pct,total:0}
              comMap[nome].total+=metade
            }
          }
        } else {
          // servico normal - mao de obra ja vem calculada (total-pecas)
          fat+=Number(o.valor||0)
          const maoObra=Number(o.valor_mao_obra||0)
          if(pct>0&&nome){
            const paraTecnico=maoObra*pct/100
            const paraEmpresa=maoObra*(1-pct/100)
            if(!comMap[nome])comMap[nome]={nome,pct,total:0}
            comMap[nome].total+=paraTecnico
            porDia[dia][nome].tecnico+=paraTecnico
            porDia[dia][nome].empresa+=paraEmpresa
          }
        }
      })

      const pm={}; concl.forEach(o=>{const m=(o.data_conclusao||o.data_entrada)?.slice(0,7);if(m)pm[m]=(pm[m]||0)+Number(o.valor||0)})
      setStats({clientes:cl||0,hoje:hojeCount,andamento,concluidas:concl.length,fat,desp:desp2,meses:Object.entries(pm).sort().slice(-6),comissoes:Object.values(comMap),porDia})
    } else {
      // tecnico — busca OS vinculadas a ele
      const [{ data: proximas }, { data: realizadas }] = await Promise.all([
        supabase.from('ordens_servico')
          .select('id,numero,cliente_nome,cliente_telefone,cliente_endereco,bairro,produto,servico,descricao,relato_cliente,periodo,status,data_entrada,valor,observacoes,tecnico_id,usuarios(nome,comissao_percentual)')
          .eq('tecnico_id', u.id)
          .eq('status','em_andamento')
          .order('data_entrada'),
        supabase.from('ordens_servico')
          .select('id,numero,cliente_nome,bairro,produto,servico,periodo,status,data_entrada,data_conclusao,valor,valor_pecas,valor_mao_obra,eh_taxa,tecnico_id,usuarios(nome,comissao_percentual)')
          .eq('tecnico_id', u.id)
          .eq('status','concluida')
          .order('data_conclusao',{ascending:false})
          .limit(30),
      ])
      const todosProx = proximas||[]
      setOsHoje(todosProx.filter(o=>o.data_entrada===hoje))
      setOsFuturas(todosProx.filter(o=>o.data_entrada>hoje))
      setOsRealizadas(realizadas||[])
      setStats(prev=>({...prev,andamento:todosProx.length,hoje:todosProx.filter(o=>o.data_entrada===hoje).length,concluidas:(realizadas||[]).length}))
    }
  }

  const [painelOS, setPainelOS] = useState(null)
  const [tecnicos, setTecnicos] = useState([])
  const [locais, setLocais] = useState({})
  const [esperandoPeca, setEsperandoPeca] = useState([])
  const [comissoes, setComissoes] = useState({})


  // ---------- CALENDARIO: carrega o mes inteiro de uma vez ----------
  async function carregarMes(ym){
    setCalMes(ym)
    setCalCarregando(true)
    const [a,m] = ym.split('-').map(Number)
    const ini = ym + '-01'
    const fim = ym + '-' + String(new Date(a, m, 0).getDate()).padStart(2,'0')
    const {data} = await supabase.from('ordens_servico')
      .select('id,numero,cliente_nome,cliente_telefone,cliente_endereco,bairro,produto,servico,descricao,relato_cliente,periodo,status,data_entrada,valor,tecnico_id,usuarios(nome)')
      .gte('data_entrada', ini).lte('data_entrada', fim).order('cliente_nome')
    const porDia = {}
    ;(data||[]).forEach(o => { if(o.data_entrada) (porDia[o.data_entrada] = porDia[o.data_entrada] || []).push(o) })
    setCalDias(porDia)
    setCalCarregando(false)
  }

  async function buscarPorData(data){
    if(!data){setOsFiltradas([]);setAgendaFiltroData('');return}
    setBuscandoFiltro(true)
    const {data:os}=await supabase.from('ordens_servico')
      .select('id,numero,cliente_nome,cliente_telefone,cliente_endereco,bairro,produto,servico,descricao,relato_cliente,periodo,status,data_entrada,valor,valor_pecas,valor_taxa,eh_taxa,valor_mao_obra,observacoes,tecnico_id,usuarios(nome,comissao_percentual)')
      .eq('data_entrada',data)
      .order('cliente_nome')
    setOsFiltradas(os||[])
    setAgendaFiltroData(data)
    setBuscandoFiltro(false)
  }

  async function buscarTecnico(tecId, data){
    if(!tecId||!data){setTecOs([]);return}
    setTecBuscando(true)
    const {data:os}=await supabase.from('ordens_servico')
      .select('id,numero,cliente_nome,bairro,produto,servico,periodo,status,data_entrada,valor,tecnico_id,usuarios(nome)')
      .eq('tecnico_id',tecId)
      .eq('data_entrada',data)
      .order('periodo')
    setTecOs(os||[])
    setTecBuscando(false)
  }

  function dgStart(i){setDragIdx(i)}
  function dgOver(e,i){e.preventDefault();setOverIdx(i)}
  function dgDrop(e,i){
    e.preventDefault()
    if(dragIdx===null||dragIdx===i){setDragIdx(null);setOverIdx(null);return}
    const arr=[...draft]; const item=arr.splice(dragIdx,1)[0]; arr.splice(i,0,item)
    setDraft(arr); setDragIdx(null); setOverIdx(null)
  }
  function dgEnd(){setDragIdx(null);setOverIdx(null)}
  function remover(id){setDraft(d=>d.filter(c=>c.id!==id))}
  function adicionar(card){setDraft(d=>[...d,{...card}])}
  function setTam(id,tam){setDraft(d=>d.map(c=>c.id===id?{...c,tamanho:tam}:c))}
  function salvar(){setConfig(draft);saveConfig(draft);setEditando(false)}
  function cancelar(){setDraft([...config]);setEditando(false)}

  if(!user) return null
  const isGestor=user.role==='gestor'
  const fmt=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const ticket=stats.concluidas?stats.fat/stats.concluidas:0
  const maxVal=Math.max(...stats.meses.map(([,v])=>v),1)
  const ausentes=CARDS_DEFAULT.filter(c=>!draft.find(d=>d.id===c.id))

  const cardVal={
    faturamento:{v:fmt(stats.fat),sub:'OS concluídas',c:t.accent,hl:true},
    ticket:{v:fmt(ticket),sub:'por serviço',c:null,hl:false},
    clientes:{v:stats.clientes,sub:null,c:null,hl:false},
    andamento:{v:stats.andamento,sub:null,c:'#854F0B',hl:false},
    concluidas:{v:stats.concluidas,sub:null,c:'#3B6D11',hl:false},
    hoje:{v:stats.hoje,sub:'serviços',c:stats.hoje>0?t.accent:null,hl:false},
  }

  const colSpan=tam=>{ if(isMobile)return'1/-1'; if(tam==='largo')return'1/-1'; if(tam==='medio')return'span 2'; return'span 1' }

  function AgendaCard({os, destaque, atrasado}) {
    const [exp, setExp] = useState(false)
    const [copiado, setCopiado] = useState(false)
    const data = os.data_entrada ? new Date(os.data_entrada+"T12:00") : null
    const corBarra = atrasado ? "#C24141" : (destaque ? t.accent : t.borderSoft)
    const bairroShort = os.bairro ? os.bairro.split(" - ").pop() : ""
    const contexto = [os.produto||os.servico, bairroShort, os.periodo?PERIODOS[os.periodo]:null, os.usuarios?.nome].filter(Boolean).join(" · ")

    async function copiar(e){
      e.stopPropagation()
      const ok = await copiarOS(os)
      if(ok){ setCopiado(true); setTimeout(()=>setCopiado(false),1600) }
    }
    function confirmar(e){
      e.stopPropagation()
      setPainelOS(os)
    }

    const Detalhes = () => (
      <div style={{margin:"0 14px 12px 62px",padding:"11px 13px",borderRadius:12,background:t.bgCard,border:"1px solid "+t.borderSoft,fontSize:12.5,color:t.textSoft,display:"flex",flexDirection:"column",gap:6}}>
        {os.cliente_telefone&&<div><span style={{color:t.textSoft,fontSize:10.5,textTransform:"uppercase",letterSpacing:".05em",fontWeight:700,display:"block"}}>Telefone</span><span style={{color:t.text}}>{os.cliente_telefone}</span></div>}
        {os.cliente_endereco&&<div><span style={{color:t.textSoft,fontSize:10.5,textTransform:"uppercase",letterSpacing:".05em",fontWeight:700,display:"block"}}>Endereço</span><span style={{color:t.text}}>{os.cliente_endereco}{os.bairro?" · "+os.bairro:""}</span></div>}
        {os.relato_cliente&&<div><span style={{color:t.textSoft,fontSize:10.5,textTransform:"uppercase",letterSpacing:".05em",fontWeight:700,display:"block"}}>Relato do cliente</span><span style={{color:t.text}}>{os.relato_cliente}</span></div>}
        {os.descricao&&<div><span style={{color:t.textSoft,fontSize:10.5,textTransform:"uppercase",letterSpacing:".05em",fontWeight:700,display:"block"}}>Diagnóstico</span><span style={{color:t.text}}>{os.descricao}</span></div>}
        {os.valor>0&&<div><span style={{color:t.textSoft,fontSize:10.5,textTransform:"uppercase",letterSpacing:".05em",fontWeight:700,display:"block"}}>Valor</span><strong style={{color:t.text,fontSize:15,fontVariantNumeric:"tabular-nums"}}>{fmt(os.valor)}</strong></div>}
      </div>
    )

    return (
      <div className="sg-card" style={{borderRadius:16,marginBottom:9,background:t.bgCard,border:"1px solid "+(atrasado?"#f0cfcf":t.borderSoft),boxShadow:t.shadow,overflow:"hidden"}}>
        <div onClick={()=>setExp(!exp)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer"}}>
          {/* data */}
          <div style={{display:"flex",alignItems:"center",gap:11,flexShrink:0}}>
            <div style={{width:3,height:38,borderRadius:99,background:corBarra}}/>
            <div style={{textAlign:"center",width:34}}>
              <div style={{fontSize:18,fontWeight:800,lineHeight:1,color:atrasado?"#C24141":t.text,fontVariantNumeric:"tabular-nums"}}>{data?data.getDate():"—"}</div>
              <div style={{fontSize:9,color:t.textSoft,textTransform:"uppercase",letterSpacing:".05em",marginTop:2}}>{data?data.toLocaleDateString("pt-BR",{month:"short"}).replace(".",""):""}</div>
            </div>
          </div>
          {/* cliente + contexto */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:t.text,fontSize:14.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{os.cliente_nome||"—"}</div>
            <div style={{fontSize:11.5,color:t.textSoft,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{contexto||"—"}</div>
          </div>
          {/* acoes */}
          <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
            {atrasado&&<span style={{background:"#fdeaea",color:"#C24141",borderRadius:999,padding:"3px 9px",fontSize:10,fontWeight:800,letterSpacing:".04em"}}>ATRASADO</span>}
            <BotaoIco n={copiado?"confirmar":"whatsapp"} t={t} size={38} tom={copiado?"sucesso":"zap"}
              titulo={copiado?"Copiado!":"Copiar p/ WhatsApp"} onClick={copiar}/>
            <BotaoPill n="confirmar" t={t} onClick={confirmar}
              style={{height:38,padding:isMobile?"0 13px":"0 15px",background:t.accent,color:"#fff",border:"1px solid "+t.accent,boxShadow:"0 6px 14px -5px "+t.accent+"99"}}>
              {isMobile?"":"Confirmar"}
            </BotaoPill>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.textSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform:exp?"rotate(180deg)":"none",transition:"transform .22s",flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        {exp&&<Detalhes/>}
      </div>
    )
  }


   function dgDrop(e,i){
    e.preventDefault()
    if(dragIdx===null||dragIdx===i){setDragIdx(null);setOverIdx(null);return}
    const arr=[...draft]; const item=arr.splice(dragIdx,1)[0]; arr.splice(i,0,item)
    setDraft(arr); setDragIdx(null); setOverIdx(null)
  }
  function dgEnd(){setDragIdx(null);setOverIdx(null)}
  function remover(id){setDraft(d=>d.filter(c=>c.id!==id))}
  function adicionar(card){setDraft(d=>[...d,{...card}])}
  function setTam(id,tam){setDraft(d=>d.map(c=>c.id===id?{...c,tamanho:tam}:c))}
  function salvar(){setConfig(draft);saveConfig(draft);setEditando(false)}
  function cancelar(){setDraft([...config]);setEditando(false)}

  const renderCard=(card,idx,edit)=>{
    const d=cardVal[card.id]
    const isDragging=edit&&dragIdx===idx
    const isOver=edit&&overIdx===idx&&dragIdx!==idx
    const baseStyle={background:t.bgCard,border:'1px solid '+(isOver?t.accent:t.border),borderRadius:16,boxShadow:t.shadow,overflow:'hidden',gridColumn:colSpan(card.tamanho),opacity:isDragging?0.4:1,position:'relative',cursor:edit?'grab':'default'}
    const dragProps=edit?{draggable:true,onDragStart:()=>dgStart(idx),onDragOver:e=>dgOver(e,idx),onDrop:e=>dgDrop(e,idx),onDragEnd:dgEnd}:{}

    // ---------- AGUARDANDO PECA ----------
    if(card.id==='aguardando_peca'){
      const hoje=new Date()
      const lista=(esperandoPeca||[]).map(o=>({
        ...o, dias: o.data_sinal ? Math.round((hoje-new Date(o.data_sinal+'T12:00'))/86400000) : null
      })).sort((a,b)=>(b.dias||0)-(a.dias||0))
      const totalSinal=lista.reduce((s,o)=>s+Number(o.valor_sinal||0),0)
      return (
        <div key={card.id} {...dragProps} style={baseStyle}>
          {edit&&<EditOverlay card={card} t={t} onRemove={()=>remover(card.id)} onTam={tam=>setTam(card.id,tam)}/>}
          <div style={{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
            <span style={{fontSize:14,fontWeight:700,color:t.text}}>Aguardando peça</span>
            {totalSinal>0&&<span style={{fontSize:11,fontWeight:700,color:'#1E48A8',background:'#E7EFFE',borderRadius:999,padding:'3px 10px'}}>{fmt(totalSinal)} adiantado</span>}
          </div>
          {lista.length===0&&<div style={{padding:'22px 18px',fontSize:13,color:t.textSoft,textAlign:'center'}}>Nenhuma peça pendente.</div>}
          {lista.map(o=>{
            const atrasada=o.dias!=null&&o.dias>15
            return (
              <div key={o.id} style={{display:'flex',alignItems:'center',gap:11,padding:'11px 18px',borderBottom:'1px solid '+t.borderSoft}}>
                <div style={{width:3,alignSelf:'stretch',borderRadius:99,background:atrasada?'#C24141':'#2F6FED',flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:700,color:t.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.cliente_nome||'—'}</div>
                  <div style={{fontSize:11.5,color:t.textSoft,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {[o.peca_pedida||o.produto, o.dias!=null?('há '+o.dias+'d'):null].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  {Number(o.valor_sinal)>0&&<div style={{fontSize:12.5,fontWeight:700,color:'#2E7A3E',fontVariantNumeric:'tabular-nums'}}>{fmt(o.valor_sinal)}</div>}
                  {atrasada&&<div style={{fontSize:9.5,fontWeight:800,color:'#C24141'}}>COBRAR FORNEC.</div>}
                </div>
              </div>
            )
          })}
          <div style={{padding:'10px 18px',fontSize:11.5,color:t.textSoft,background:t.bgSidebar,lineHeight:1.5}}>
            O adiantado não entra no faturamento — só quando a OS for concluída.
          </div>
        </div>
      )
    }

    // ---------- CALENDARIO DE SERVICOS ----------
    if(card.id==='calendario'){
      const [ano,mes] = calMes.split('-').map(Number)
      const primeiro = new Date(ano, mes-1, 1)
      const diasNoMes = new Date(ano, mes, 0).getDate()
      const vazias = primeiro.getDay()                  // 0=domingo
      const hojeISO = new Date().toISOString().split('T')[0]
      const nomeMes = primeiro.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
      const celulas = []
      for(let i=0;i<vazias;i++) celulas.push(null)
      for(let d=1;d<=diasNoMes;d++) celulas.push(calMes+'-'+String(d).padStart(2,'0'))
      const doDia = calDias[calSel]||[]
      function irMes(delta){
        const dt = new Date(ano, mes-1+delta, 1)
        carregarMes(dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'))
      }
      const btnMes = {width:32,height:32,borderRadius:10,border:'1px solid '+t.border,background:t.bgCard,color:t.text,cursor:'pointer',fontSize:15,lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center'}
      return (
        <div key={card.id} {...dragProps} style={baseStyle}>
          {edit&&<EditOverlay card={card} t={t} onRemove={()=>remover(card.id)} onTam={tam=>setTam(card.id,tam)}/>}
          <div style={{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
            <span style={{fontSize:15,fontWeight:700,color:t.text,textTransform:'capitalize'}}>{nomeMes}</span>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <button className="sg-btn" style={btnMes} onClick={()=>irMes(-1)}>‹</button>
              <button className="sg-btn" style={{...btnMes,width:'auto',padding:'0 12px',fontSize:12,fontWeight:600}}
                onClick={()=>{const h=new Date();carregarMes(h.toISOString().slice(0,7));setCalSel(h.toISOString().split('T')[0])}}>Hoje</button>
              <button className="sg-btn" style={btnMes} onClick={()=>irMes(1)}>›</button>
            </div>
          </div>

          <div style={{padding:'12px 14px'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5,marginBottom:6}}>
              {['DOM','SEG','TER','QUA','QUI','SEX','SAB'].map(d=>(
                <div key={d} style={{textAlign:'center',fontSize:9.5,fontWeight:700,letterSpacing:'.06em',color:t.textSoft,padding:'4px 0'}}>{d}</div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5}}>
              {celulas.map((iso,i)=>{
                if(!iso) return <div key={'v'+i}/>
                const lista = calDias[iso]||[]
                const qtd = lista.length
                const concl = lista.filter(o=>o.status==='concluida').length
                const sel = calSel===iso
                const hoje = hojeISO===iso
                const dia = Number(iso.slice(-2))
                let fundo = t.dark?t.bgHover:t.bg, cor = t.textSoft, borda = '1px solid transparent'
                if(qtd) { cor = t.text }
                if(hoje) borda = '1px solid '+t.accent
                if(sel)  { fundo = grad('dashboard'); cor = '#fff'; borda = '1px solid transparent' }
                return (
                  <button key={iso} className="sg-btn" onClick={()=>setCalSel(iso)}
                    style={{position:'relative',height:isMobile?46:54,borderRadius:12,border:borda,background:fundo,color:cor,
                            cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',
                            fontSize:isMobile?13:14,fontWeight:sel||hoje?700:500,padding:0,
                            boxShadow:sel?'0 8px 18px -6px '+GRADIENTES.dashboard[1]+'99':'none'}}>
                    {dia}
                    {qtd>0&&(
                      <span style={{position:'absolute',bottom:4,right:4,minWidth:15,height:15,padding:'0 3px',borderRadius:999,
                                    fontSize:9.5,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',
                                    background:sel?'rgba(255,255,255,.28)':(concl===qtd?'#3B6D11':t.accent),color:'#fff'}}>{qtd}</span>
                    )}
                  </button>
                )
              })}
            </div>
            {calCarregando&&<div style={{fontSize:12,color:t.textSoft,textAlign:'center',padding:'10px 0'}}>Carregando...</div>}
          </div>

          {/* servicos do dia escolhido */}
          <div style={{borderTop:'1px solid '+t.borderSoft,padding:'12px 16px',background:t.bgSidebar}}>
            <div style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:t.textSoft,marginBottom:10}}>
              {new Date(calSel+'T12:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}
              {doDia.length>0&&' — '+doDia.length+' serviço'+(doDia.length>1?'s':'')}
            </div>
            {doDia.length===0&&<div style={{fontSize:13,color:t.textSoft,padding:'6px 0 10px'}}>Nenhum serviço nesta data.</div>}
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {doDia.map(o=>(
                <div key={o.id} className="sg-card" style={{background:t.bgCard,border:'1px solid '+(o.status==='concluida'?'#3B6D11':t.borderSoft),borderRadius:12,padding:'10px 12px',display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:4,alignSelf:'stretch',borderRadius:99,background:o.status==='concluida'?'#3B6D11':t.accent,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:t.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.cliente_nome||'—'}</div>
                    <div style={{fontSize:11.5,color:t.textSoft,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {[o.produto||o.servico, o.bairro, o.usuarios?.nome].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    {o.periodo&&<div style={{fontSize:10.5,fontWeight:700,color:t.accent}}>{PERIODOS[o.periodo]||o.periodo}</div>}
                    {o.valor>0&&<div style={{fontSize:12,fontWeight:700,color:t.text,fontVariantNumeric:'tabular-nums'}}>{fmt(o.valor)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    // AGENDA
    if(card.id==='agenda'){
      return (
        <div key={card.id} {...dragProps} style={baseStyle}>
          {edit&&<EditOverlay card={card} t={t} onRemove={()=>remover(card.id)} onTam={tam=>setTam(card.id,tam)}/>}
          <div style={{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
            <span style={{display:'flex',alignItems:'center',gap:9}}>
              <span style={{fontSize:14,fontWeight:600,color:t.text}}>Agenda de serviços</span>
              {stats.hoje>0&&<span style={{fontSize:11,fontWeight:600,color:t.accent,background:t.dark?t.bgHover:t.accentSoft,borderRadius:999,padding:'3px 10px'}}>{stats.hoje} hoje</span>}
            </span>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <input type="date" value={agendaFiltroData} onChange={e=>buscarPorData(e.target.value)}
                style={{padding:'5px 10px',borderRadius:8,border:'1px solid '+t.border,background:t.bgInput,color:t.text,fontSize:12,fontFamily:'inherit',cursor:'pointer'}}/>
              {agendaFiltroData&&<button onClick={()=>buscarPorData('')} style={{padding:'5px 10px',borderRadius:8,border:'1px solid '+t.border,background:t.bgSidebar,color:t.textSoft,fontSize:12,cursor:'pointer'}}>✕ Limpar</button>}
              <Link href="/os" style={{fontSize:11,padding:'5px 10px',borderRadius:8,border:'1px solid '+t.border,color:t.text,background:t.bgSidebar}}>Ver OS</Link>
            </div>
          </div>
          <div style={{padding:'12px 16px'}}>
            {agendaFiltroData?(
              <>
                {buscandoFiltro&&<div style={{fontSize:13,color:t.textSoft,textAlign:'center',padding:16}}>Buscando...</div>}
                {!buscandoFiltro&&osFiltradas.length===0&&<div style={{fontSize:13,color:t.textSoft,textAlign:'center',padding:16}}>Nenhum serviço nesta data.</div>}
                {!buscandoFiltro&&osFiltradas.length>0&&(
                  <>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:t.accent,marginBottom:8,letterSpacing:'.06em'}}>
                      {new Date(agendaFiltroData+'T12:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})} — {osFiltradas.length} serviço{osFiltradas.length>1?'s':''}
                    </div>
                    {osFiltradas.map(o=>(
                      <div key={o.id} style={{borderRadius:10,marginBottom:8,background:t.bgSidebar,border:'1px solid '+(o.status==='concluida'?'#3B6D11':t.borderSoft)}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px'}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:600,color:t.text,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.cliente_nome||'—'}</div>
                            <div style={{fontSize:11,color:t.textSoft,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.produto||o.servico||'—'}{o.bairro?' · '+o.bairro:''}</div>
                          </div>
                          <div style={{textAlign:'right',flexShrink:0}}>
                            {o.periodo&&<div style={{fontSize:11,color:t.textSoft}}>{PERIODOS[o.periodo]||o.periodo}</div>}
                            <div style={{fontSize:11,color:t.textSoft}}>{o.usuarios?.nome||'—'}</div>
                          </div>
                          {o.valor>0&&<div style={{fontSize:13,fontWeight:600,color:t.accent,flexShrink:0}}>{fmt(o.valor)}</div>}
                          <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:o.status==='concluida'?'#EAF3DE':'#FAEEDA',color:o.status==='concluida'?'#3B6D11':'#854F0B',flexShrink:0}}>{o.status==='concluida'?'Concluída':'Em andamento'}</span>
                          <button onClick={()=>{setPainelOS(o)}} style={{padding:'5px 10px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:11,cursor:'pointer',fontWeight:600,flexShrink:0,whiteSpace:'nowrap'}}>
                            ✓ {o.status==='concluida'?'Editar':'Confirmar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            ):(
              <>
                {osHoje.length===0&&osFuturas.length===0&&(
                  <div style={{fontSize:13,color:t.textSoft,textAlign:'center',padding:16}}>Nenhum serviço agendado.</div>
                )}
                {osHoje.length>0&&(
                  <>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:t.accent,marginBottom:8,letterSpacing:'.06em'}}>Hoje — {osHoje.length} serviço{osHoje.length>1?'s':''}</div>
                    {osHoje.map(o=><AgendaCard key={o.id} os={o} destaque={true}/>)}
                  </>
                )}
                {osFuturas.length>0&&(
                  <>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:t.textSoft,margin:'12px 0 8px',letterSpacing:'.06em'}}>Próximos dias</div>
                    {osFuturas.map(o=><AgendaCard key={o.id} os={o} destaque={false}/>)}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )
    }

    // SERVIÇOS POR TÉCNICO HOJE
    if(card.id==='por_tecnico'){
      const PERIODO_ORDEM={manha:0,tarde:1,noite:2}
      const lista=[...tecOs].sort((a,b)=>(PERIODO_ORDEM[a.periodo]??3)-(PERIODO_ORDEM[b.periodo]??3))
      const grupos={manha:[],tarde:[],noite:[],sem:[]}
      lista.forEach(o=>{ grupos[o.periodo||'sem'] ? grupos[o.periodo||'sem'].push(o) : grupos.sem.push(o) })
      const tecNome=tecnicos.find(tt=>tt.id===tecFiltroId)?.nome
      return (
        <div key={card.id} {...dragProps} style={baseStyle}>
          {edit&&<EditOverlay card={card} t={t} onRemove={()=>remover(card.id)} onTam={tam=>setTam(card.id,tam)}/>}
          <div style={{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft}}>
            <span style={{fontSize:14,fontWeight:600,color:t.text}}>Serviços por técnico</span>
          </div>
          <div style={{padding:'14px 18px'}}>
            {/* CONTROLES */}
            <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
              <select value={tecFiltroId} onChange={e=>{setTecFiltroId(e.target.value);buscarTecnico(e.target.value,tecFiltroData)}}
                style={{flex:1,minWidth:140,padding:'9px 12px',borderRadius:8,border:'1px solid '+t.border,background:t.bgInput,color:t.text,fontSize:13,fontFamily:'inherit',cursor:'pointer'}}>
                <option value="">Selecione um técnico...</option>
                {tecnicos.map(tc=><option key={tc.id} value={tc.id}>{tc.nome}</option>)}
              </select>
              <input type="date" value={tecFiltroData} onChange={e=>{setTecFiltroData(e.target.value);if(tecFiltroId)buscarTecnico(tecFiltroId,e.target.value)}}
                style={{padding:'9px 12px',borderRadius:8,border:'1px solid '+t.border,background:t.bgInput,color:t.text,fontSize:13,fontFamily:'inherit',cursor:'pointer'}}/>
            </div>

            {/* RESULTADO */}
            {!tecFiltroId&&<div style={{fontSize:13,color:t.textSoft,textAlign:'center',padding:20}}>Selecione um técnico para ver os serviços.</div>}
            {tecFiltroId&&tecBuscando&&<div style={{fontSize:13,color:t.textSoft,textAlign:'center',padding:20}}>Buscando...</div>}
            {tecFiltroId&&!tecBuscando&&lista.length===0&&<div style={{fontSize:13,color:t.textSoft,textAlign:'center',padding:20}}>Nenhum serviço para {tecNome} nesta data.</div>}
            {tecFiltroId&&!tecBuscando&&lista.length>0&&(
              <>
                <div style={{fontSize:11,fontWeight:700,color:t.accent,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:12}}>
                  {tecNome} — {lista.length} serviço{lista.length>1?'s':''}
                </div>
                {['manha','tarde','noite','sem'].map(per=>{
                  if(!grupos[per]||grupos[per].length===0) return null
                  return (
                    <div key={per} style={{marginBottom:14}}>
                      <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:t.textSoft,letterSpacing:'.06em',marginBottom:6}}>
                        {per==='sem'?'Sem período':PERIODOS[per]}
                      </div>
                      {grupos[per].map(o=>(
                        <div key={o.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,background:t.bgSidebar,marginBottom:6,border:'1px solid '+(o.status==='concluida'?'#3B6D11':t.borderSoft)}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:600,color:t.text,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.cliente_nome||'—'}</div>
                            <div style={{fontSize:11,color:t.textSoft,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.produto||o.servico||'—'}{o.bairro?' · '+o.bairro.split(' - ').pop():''}</div>
                          </div>
                          <span style={{padding:'2px 8px',borderRadius:999,fontSize:10,fontWeight:600,background:o.status==='concluida'?'#EAF3DE':'#FAEEDA',color:o.status==='concluida'?'#3B6D11':'#854F0B',flexShrink:0}}>
                            {o.status==='concluida'?'Concluído':'Pendente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )
    }

    // COMISSÕES
    if(card.id==='comissoes'){
      const lista = stats.comissoes||[]
      return (
        <div key={card.id} {...dragProps} style={baseStyle}>
          {edit&&<EditOverlay card={card} t={t} onRemove={()=>remover(card.id)} onTam={tam=>setTam(card.id,tam)}/>}
          <div style={{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft}}>
            <span style={{fontSize:14,fontWeight:600,color:t.text}}>Comissões técnicos</span>
          </div>
          <div style={{padding:'14px 18px'}}>
            {lista.length===0&&<div style={{fontSize:13,color:t.textSoft}}>Nenhuma comissão registrada.</div>}
            {lista.map(c=>(
              <div key={c.nome} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,padding:'10px 12px',borderRadius:8,background:t.bgSidebar,border:'1px solid '+t.borderSoft}}>
                <div>
                  <div style={{fontWeight:600,color:t.text,fontSize:13}}>{c.nome}</div>
                  <div style={{fontSize:11,color:t.textSoft,marginTop:1}}>{c.pct}% de mão de obra</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:16,fontWeight:700,color:t.accent}}>{fmt(c.total)}</div>
                  <div style={{fontSize:11,color:t.textSoft}}>a pagar</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // COMISSOES POR DIA
    if(card.id==='comissoes_dia'){
      const porDia = stats.porDia||{}
      const dias = Object.keys(porDia).sort().reverse().slice(0,10)
      return (
        <div key={card.id} {...dragProps} style={baseStyle}>
          {edit&&<EditOverlay card={card} t={t} onRemove={()=>remover(card.id)} onTam={tam=>setTam(card.id,tam)}/>}
          <div style={{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft}}>
            <span style={{fontSize:14,fontWeight:600,color:t.text}}>Comissões por dia</span>
          </div>
          <div style={{padding:'14px 18px',maxHeight:340,overflow:'auto'}}>
            {dias.length===0&&<div style={{fontSize:13,color:t.textSoft}}>Nenhum dado ainda.</div>}
            {dias.map(dia=>{
              const tecnicosNoDia = Object.entries(porDia[dia]).filter(([,v])=>v.empresa>0||v.tecnico>0)
              if(tecnicosNoDia.length===0) return null
              return (
                <div key={dia} style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:t.textSoft,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>
                    {new Date(dia+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',weekday:'short'})}
                  </div>
                  {tecnicosNoDia.map(([nome,v])=>(
                    <div key={nome} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',borderRadius:8,background:t.bgSidebar,marginBottom:4,fontSize:12}}>
                      <span style={{fontWeight:600,color:t.text}}>{nome}</span>
                      <span style={{color:t.textSoft}}>
                        Empresa <strong style={{color:t.text}}>{fmt(v.empresa)}</strong>
                        {v.tecnico>0&&<> · {nome} <strong style={{color:t.accent}}>{fmt(v.tecnico)}</strong></>}
                      </span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    // GRÁFICO
    if(card.id==='grafico'){
      return (
        <div key={card.id} {...dragProps} style={baseStyle}>
          {edit&&<EditOverlay card={card} t={t} onRemove={()=>remover(card.id)} onTam={tam=>setTam(card.id,tam)}/>}
          <div style={{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:14,fontWeight:600,color:t.text}}>Receita por mês</span>
            {!edit&&<Link href="/faturamento" style={{fontSize:11,padding:'5px 10px',borderRadius:8,border:'1px solid '+t.border,color:t.text,background:t.bgSidebar}}>Ver tudo</Link>}
          </div>
          <div style={{padding:'16px 18px'}}>
            {stats.meses.length===0&&<div style={{fontSize:13,color:t.textSoft}}>Sem dados ainda.</div>}
            {stats.meses.map(([mes,val])=>{
              const nm=new Date(mes+'-01').toLocaleDateString('pt-BR',{month:'short',year:'2-digit'})
              return <div key={mes} style={{display:'flex',alignItems:'center',gap:10,fontSize:12,marginBottom:10}}>
                <span style={{width:55,color:t.textSoft,flexShrink:0,textTransform:'capitalize'}}>{nm}</span>
                <div style={{flex:1,height:12,background:t.bgSidebar,borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',background:t.accent,borderRadius:99,width:Math.round(val/maxVal*100)+'%'}}/></div>
                <span style={{width:90,textAlign:'right',fontWeight:600,color:t.text,fontSize:isMobile?11:12}}>{fmt(val)}</span>
              </div>
            })}
          </div>
        </div>
      )
    }

    // LOCALIZACAO DOS TECNICOS — visivel so no dashboard do gestor.
    // O tecnico nunca ve esse card (a tela dele e outra, mais abaixo no arquivo).
    if(card.id==='localizacao'){
      const agora=Date.now()
      const lista=tecnicos.filter(tc=>tc.id!==user?.id)
      return (
        <div key={card.id} {...dragProps} style={baseStyle}>
          {edit&&<EditOverlay card={card} t={t} onRemove={()=>remover(card.id)} onTam={tam=>setTam(card.id,tam)}/>}
          <div style={{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
            <span style={{fontSize:14,fontWeight:600,color:t.text}}>Localização dos técnicos</span>
            <span style={{fontSize:10.5,fontWeight:600,color:t.textSoft,background:t.bgSidebar,borderRadius:999,padding:'3px 10px',whiteSpace:'nowrap'}}>Só o gestor vê</span>
          </div>
          <div>
            {lista.length===0&&<div style={{padding:20,fontSize:13,color:t.textSoft,textAlign:'center'}}>Nenhum técnico ativo.</div>}
            {lista.map(tc=>{
              const l=locais[tc.id]
              const min=l?Math.floor((agora-new Date(l.criado_em).getTime())/60000):null
              let cor=t.textSoft, texto='app não aberto ainda'
              if(min!==null){
                if(min<15){ cor='#3B6D11'; texto='ativo agora · visto há '+(min<1?'menos de 1':min)+' min' }
                else if(min<180){ cor='#B4790C'; texto='última posição · há '+min+' min' }
                else { texto='última posição · '+new Date(l.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) }
              }
              return (
                <div key={tc.id} style={{display:'flex',alignItems:'center',gap:11,padding:'11px 18px',borderBottom:'1px solid '+t.borderSoft}}>
                  <div style={{width:30,height:30,borderRadius:'50%',background:t.bgSidebar,color:t.textSoft,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{(tc.nome||'?').charAt(0).toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:t.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tc.nome}</div>
                    <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11.5,color:t.textSoft,marginTop:2}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:cor,flexShrink:0}}/>{texto}
                    </div>
                  </div>
                  {l&&<a href={'https://www.google.com/maps?q='+l.lat+','+l.lng} target="_blank" rel="noreferrer" style={{fontSize:11.5,fontWeight:600,color:t.accent,textDecoration:'none',flexShrink:0,padding:'5px 11px',borderRadius:7,border:'1px solid '+t.border}}>Mapa</a>}
                </div>
              )
            })}
          </div>
          <div style={{padding:'10px 18px',fontSize:11.5,color:t.textSoft,background:t.bgSidebar,lineHeight:1.5}}>
            Atualiza sozinho quando o técnico abre o app pra ver os serviços.
          </div>
        </div>
      )
    }

    // CARD SIMPLES
    if(!d) return null
    return (
      <div key={card.id} {...dragProps} style={{...baseStyle,padding:'16px 18px',border:'1px solid '+(isOver?t.accent:d.hl?t.accent:t.border),background:d.hl?(t.dark?t.bgHover:t.accentSoft):t.bgCard}}>
        {edit&&<EditOverlay card={card} t={t} onRemove={()=>remover(card.id)} onTam={tam=>setTam(card.id,tam)}/>}
        <div style={{fontSize:11,color:t.textSoft,marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>{card.label}</div>
        <div style={{fontSize:isMobile?20:card.tamanho==='pequeno'?20:27,fontWeight:700,color:d.c||t.text,fontVariantNumeric:'tabular-nums',letterSpacing:'-.02em'}}>{d.v}</div>
        {d.sub&&<div style={{fontSize:11,color:t.textSoft,marginTop:4}}>{d.sub}</div>}
        {card.id==='faturamento'&&stats.meses.length>1&&(
          <div style={{display:'flex',alignItems:'flex-end',gap:3,height:28,marginTop:10}} title="Ultimos 6 meses">
            {stats.meses.map(([mes,val],i)=>(
              <div key={mes} style={{flex:1,height:Math.max(Math.round(val/maxVal*100),8)+'%',background:i===stats.meses.length-1?t.accent:t.accent+'55',borderRadius:'3px 3px 0 0'}}/>
            ))}
          </div>
        )}
      </div>
    )
  }

  const fmt2 = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})

  return (
    <Layout title={isGestor?'Dashboard':'Meus Serviços'}>
      {/* PAINEL CONFIRMAR SERVIÇO — renderiza no body (funciona em qualquer tela) */}
      <PainelConfirmar os={painelOS} t={t} onFechar={()=>setPainelOS(null)} onSalvo={()=>{setPainelOS(null);loadData(user)}}/>
      {isGestor?(
        <>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
            <button style={{padding:'6px 14px',borderRadius:8,border:'1px solid '+t.border,background:editando?t.accent:t.bgCard,color:editando?'#fff':t.text,fontSize:12,cursor:'pointer',fontWeight:500}} onClick={()=>editando?cancelar():setEditando(true)}>
              {editando?'× Cancelar':'⊞ Editar dashboard'}
            </button>
          </div>

          {editando&&(
            <div style={{background:t.bgCard,border:'2px dashed '+t.accent,borderRadius:12,padding:20,marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:600,color:t.text,marginBottom:2}}>Arraste para reordenar</div>
              <div style={{fontSize:12,color:t.textSoft,marginBottom:16}}>Segure e arraste · Toggle para mostrar/ocultar · P M L para tamanho</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {draft.map((card,idx)=>(
                  <div key={card.id} draggable onDragStart={()=>dgStart(idx)} onDragOver={e=>dgOver(e,idx)} onDrop={e=>dgDrop(e,idx)} onDragEnd={dgEnd}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,border:'1px solid '+(overIdx===idx?t.accent:t.borderSoft),background:dragIdx===idx?t.accentSoft:t.bgSidebar,cursor:'grab',userSelect:'none'}}>
                    <div style={{color:t.textSoft,fontSize:16,flexShrink:0}}>⠿</div>
                    <div onClick={()=>{setDraft(d=>d.map(x=>x.id===card.id?{...x,ativo:!x.ativo}:x))}} style={{width:36,height:20,borderRadius:10,background:card.ativo!==false?t.accent:t.borderSoft,cursor:'pointer',position:'relative',flexShrink:0}} onDragStart={e=>e.stopPropagation()}>
                      <div style={{position:'absolute',top:2,left:card.ativo!==false?18:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .15s'}}/>
                    </div>
                    <span style={{flex:1,fontSize:13,color:t.text,fontWeight:500}}>{card.label}</span>
                    <div style={{display:'flex',gap:4}} onDragStart={e=>e.stopPropagation()}>
                      {['pequeno','medio','largo'].map(tam=>(
                        <button key={tam} onClick={()=>setTam(card.id,tam)} style={{padding:'3px 8px',borderRadius:6,border:'1px solid '+(card.tamanho===tam?t.accent:t.border),background:card.tamanho===tam?t.accentSoft:'transparent',color:card.tamanho===tam?t.accentDark:t.textSoft,fontSize:11,cursor:'pointer'}}>
                          {tam==='pequeno'?'P':tam==='medio'?'M':'L'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
                <button style={{padding:'8px 16px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:13,cursor:'pointer'}} onClick={()=>setDraft([...CARDS_DEFAULT])}>Resetar</button>
                <button style={{padding:'8px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500}} onClick={salvar}>Salvar layout</button>
              </div>
              {ausentes.length>0&&(
                <div style={{marginTop:16,paddingTop:16,borderTop:'1px solid '+t.borderSoft}}>
                  <div style={{fontSize:12,color:t.textSoft,marginBottom:8}}>Cards removidos:</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {ausentes.map(c=><button key={c.id} onClick={()=>adicionar(c)} style={{padding:'5px 12px',borderRadius:8,border:'1px solid '+t.border,background:t.bgSidebar,color:t.text,fontSize:12,cursor:'pointer'}}><span style={{color:t.accent}}>+</span> {c.label}</button>)}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(4,1fr)',gap:12,marginBottom:16}}>
            {(editando?draft:config).filter(c=>c.ativo!==false).map((card,idx)=>renderCard(card,idx,editando))}
            {editando&&<div onDragOver={e=>{e.preventDefault();setOverIdx(draft.length)}} onDrop={e=>{e.preventDefault();if(dragIdx!==null){const arr=[...draft];const item=arr.splice(dragIdx,1)[0];arr.push(item);setDraft(arr);setDragIdx(null);setOverIdx(null)}}} style={{border:'2px dashed '+t.borderSoft,borderRadius:12,minHeight:60,gridColumn:'1/-1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:t.textSoft}}>Solte aqui</div>}
          </div>
        </>
      ):(
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
            {[['Hoje',osHoje.length,t.accent],['Próximos',osFuturas.length,null],['Realizados',osRealizadas.length,'#3B6D11']].map(([l,v,cor])=>(
              <div key={l} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:'12px 14px',boxShadow:t.shadow}}><div style={{fontSize:10,color:t.textSoft,marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:cor||t.text,fontVariantNumeric:'tabular-nums'}}>{v}</div></div>
            ))}
          </div>
          {osHoje.length>0&&(
            <div style={{fontSize:12,fontWeight:700,color:t.accent,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>
              Hoje — {osHoje.length} serviço{osHoje.length>1?'s':''}
            </div>
          )}
          {osHoje.map(o=>(
            <div key={o.id} style={{background:t.bgCard,border:'1px solid '+t.accent,borderRadius:12,padding:'14px',marginBottom:10,boxShadow:t.shadow}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div style={{flex:1,minWidth:0,marginRight:8}}>
                  <div style={{fontWeight:700,color:t.text,fontSize:16}}>{o.cliente_nome||'—'}</div>
                  <div style={{fontSize:13,color:t.textSoft,marginTop:2}}>{o.produto||o.servico||'—'}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  {o.periodo&&<div style={{fontSize:12,fontWeight:600,color:t.accent}}>{PERIODOS[o.periodo]||o.periodo}</div>}
                  <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:600,background:t.accent,color:'#fff',marginTop:4}}>HOJE</span>
                </div>
              </div>
              <div style={{background:t.bgSidebar,borderRadius:8,padding:'10px 12px',marginBottom:10,fontSize:12,color:t.textSoft,display:'flex',flexDirection:'column',gap:5}}>
                {o.cliente_telefone&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Telefone:</span>{o.cliente_telefone}</div>}
                {o.cliente_endereco&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Endereço:</span>{o.cliente_endereco}</div>}
                {o.bairro&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Bairro:</span>{o.bairro.split(' - ').pop()}</div>}
                {o.relato_cliente&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Relato:</span>{o.relato_cliente}</div>}
                {o.descricao&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Diagnóstico:</span>{o.descricao}</div>}
                {o.observacoes&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Obs:</span>{o.observacoes}</div>}
                {o.data_entrada&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Data:</span>{new Date(o.data_entrada+'T12:00').toLocaleDateString('pt-BR')}</div>}
                {o.valor>0&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Valor:</span><strong style={{color:t.accent}}>{fmt(o.valor)}</strong></div>}
              </div>
              <button onClick={()=>{setPainelOS(o)}}
                style={{width:'100%',padding:'12px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:15,cursor:'pointer',fontWeight:600}}>
                ✓ Confirmar serviço
              </button>
            </div>
          ))}
          {osFuturas.length>0&&(
            <div style={{fontSize:12,fontWeight:700,color:t.textSoft,textTransform:'uppercase',letterSpacing:'.06em',margin:'12px 0 8px'}}>
              Próximos dias
            </div>
          )}
          {osFuturas.map(o=>(
            <div key={o.id} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:'14px',marginBottom:10,boxShadow:t.shadow}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div style={{flex:1,minWidth:0,marginRight:8}}>
                  <div style={{fontWeight:600,color:t.text,fontSize:15}}>{o.cliente_nome||'—'}</div>
                  <div style={{fontSize:13,color:t.textSoft,marginTop:2}}>{o.produto||o.servico||'—'}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  {o.periodo&&<div style={{fontSize:12,fontWeight:600,color:t.textSoft}}>{PERIODOS[o.periodo]||o.periodo}</div>}
                  <div style={{fontSize:11,color:t.textSoft,marginTop:2}}>{o.data_entrada?new Date(o.data_entrada+'T12:00').toLocaleDateString('pt-BR'):''}</div>
                </div>
              </div>
              <div style={{background:t.bgSidebar,borderRadius:8,padding:'10px 12px',fontSize:12,color:t.textSoft,display:'flex',flexDirection:'column',gap:5}}>
                {o.cliente_telefone&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Telefone:</span>{o.cliente_telefone}</div>}
                {o.cliente_endereco&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Endereço:</span>{o.cliente_endereco}</div>}
                {o.bairro&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Bairro:</span>{o.bairro.split(' - ').pop()}</div>}
                {o.relato_cliente&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Relato:</span>{o.relato_cliente}</div>}
                {o.descricao&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Diagnóstico:</span>{o.descricao}</div>}
                {o.observacoes&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Obs:</span>{o.observacoes}</div>}
              </div>
            </div>
          ))}

          {/* JÁ REALIZADOS */}
          {osRealizadas.length>0&&(
            <div style={{fontSize:12,fontWeight:700,color:'#3B6D11',textTransform:'uppercase',letterSpacing:'.06em',margin:'20px 0 8px'}}>
              Já realizados
            </div>
          )}
          {osRealizadas.map(o=>{
            const pct=o.usuarios?.comissao_percentual||0
            const maoObra=Number(o.valor_mao_obra||0)
            const ganhou=o.eh_taxa?(pct>0?maoObra/2:0):(pct>0?maoObra*pct/100:0)
            return (
              <div key={o.id} style={{background:t.bgCard,border:'1px solid #DCEAD0',borderRadius:12,padding:'12px 14px',marginBottom:8,boxShadow:t.shadow}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                  <div style={{flex:1,minWidth:0,marginRight:8}}>
                    <div style={{fontWeight:600,color:t.text,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.cliente_nome||'—'}</div>
                    <div style={{fontSize:12,color:t.textSoft,marginTop:2}}>{o.produto||o.servico||'—'}{o.bairro?' · '+o.bairro.split(' - ').pop():''}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:10,fontWeight:600,background:'#EAF3DE',color:'#3B6D11'}}>
                      {o.eh_taxa?'TAXA':'CONCLUÍDO'}
                    </span>
                    <div style={{fontSize:11,color:t.textSoft,marginTop:3}}>{o.data_conclusao?new Date(o.data_conclusao+'T12:00').toLocaleDateString('pt-BR'):''}</div>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',paddingTop:6,borderTop:'1px solid '+t.borderSoft,fontSize:12}}>
                  <span style={{color:t.textSoft}}>Valor: <strong style={{color:t.text}}>{fmt(o.valor)}</strong></span>
                  {ganhou>0&&<span style={{color:t.textSoft}}>Você: <strong style={{color:t.accent}}>{fmt(ganhou)}</strong></span>}
                </div>
              </div>
            )
          })}

          {osHoje.length===0&&osFuturas.length===0&&osRealizadas.length===0&&<div style={{fontSize:13,color:t.textSoft,padding:16,textAlign:'center'}}>Nenhum serviço agendado.</div>}
        </>
      )}    </Layout>
  )
}

function EditOverlay({card,t,onRemove,onTam}){
  return <div style={{position:'absolute',top:6,right:6,display:'flex',gap:4,zIndex:10}} onDragStart={e=>e.stopPropagation()}>
    {['pequeno','medio','largo'].map(tam=>(
      <button key={tam} onClick={()=>onTam(tam)} style={{padding:'2px 6px',borderRadius:4,border:'1px solid '+(card.tamanho===tam?t.accent:t.border),background:card.tamanho===tam?t.accentSoft:t.bgCard,color:card.tamanho===tam?t.accentDark:t.textSoft,fontSize:10,cursor:'pointer'}}>
        {tam==='pequeno'?'P':tam==='medio'?'M':'L'}
      </button>
    ))}
    <button onClick={onRemove} style={{padding:'2px 6px',borderRadius:4,border:'1px solid #FCEBEB',background:'#FCEBEB',color:'#A32D2D',fontSize:12,cursor:'pointer',fontWeight:700}}>×</button>
  </div>
}
