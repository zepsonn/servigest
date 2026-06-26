// atualizado 2026-06-15 15:49
import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import Link from 'next/link'

function useIsMobile(){ const [m,setM]=useState(false); useEffect(()=>{const c=()=>setM(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);return m }
const badgeColors={em_andamento:['#FAEEDA','#854F0B'],concluido:['#EAF3DE','#3B6D11'],concluida:['#EAF3DE','#3B6D11']}
function Badge({s}){const[bg,c]=badgeColors[s]||['#F1EFE8','#5F5E5A'];return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{(s||'').replace('_',' ')}</span>}

const CARDS_DEFAULT = [
  {id:'faturamento',label:'Faturamento',tamanho:'medio'},
  {id:'despesas',label:'Despesas',tamanho:'medio'},
  {id:'lucro',label:'Lucro',tamanho:'medio'},
  {id:'ticket',label:'Ticket médio',tamanho:'medio'},
  {id:'clientes',label:'Clientes ativos',tamanho:'pequeno'},
  {id:'andamento',label:'Em andamento',tamanho:'pequeno'},
  {id:'concluidas',label:'Concluídas',tamanho:'pequeno'},
  {id:'hoje',label:'Agenda hoje',tamanho:'pequeno'},
  {id:'agenda',label:'Agenda de serviços',tamanho:'largo'},
  {id:'por_tecnico',label:'Serviços por técnico hoje',tamanho:'largo'},
  {id:'grafico',label:'Receita por mês',tamanho:'largo'},
  {id:'comissoes',label:'Comissões técnicos',tamanho:'medio'},
  {id:'comissoes_dia',label:'Comissões por dia',tamanho:'medio'},
]

function loadConfig(){
  try{ const c=JSON.parse(localStorage.getItem('db_cfg2')); return c&&c.length?c:CARDS_DEFAULT }
  catch{ return CARDS_DEFAULT }
}
function saveConfig(c){ localStorage.setItem('db_cfg2',JSON.stringify(c)) }

const PERIODOS = {manha:'Manhã',tarde:'Tarde',noite:'Noite'}

export default function Dashboard(){
  const [user,setUser]=useState(null)
  const [stats,setStats]=useState({clientes:0,hoje:0,andamento:0,concluidas:0,fat:0,desp:0,meses:[]})
  const [osHoje,setOsHoje]=useState([])
  const [osFuturas,setOsFuturas]=useState([])
  const [agendaFiltroData,setAgendaFiltroData]=useState('')
  const [osFiltradas,setOsFiltradas]=useState([])
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
        supabase.from('ordens_servico').select('id,numero,cliente_nome,cliente_telefone,cliente_endereco,bairro,produto,servico,descricao,periodo,status,data_entrada,valor,observacoes,tecnico_id,usuarios(nome,comissao_percentual)')
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
      const { data: proximas } = await supabase
        .from('ordens_servico')
        .select('id,numero,cliente_nome,cliente_telefone,cliente_endereco,bairro,produto,servico,descricao,periodo,status,data_entrada,valor,observacoes,tecnico_id,usuarios(nome,comissao_percentual)')
        .eq('tecnico_id', u.id)
        .eq('status','em_andamento')
        .order('data_entrada')
      const todosProx = proximas||[]
      setOsHoje(todosProx.filter(o=>o.data_entrada===hoje))
      setOsFuturas(todosProx.filter(o=>o.data_entrada>hoje))
      setStats(prev=>({...prev,andamento:todosProx.length,hoje:todosProx.filter(o=>o.data_entrada===hoje).length}))
    }
  }

  const [painelOS, setPainelOS] = useState(null)
  const [painelValor, setPainelValor] = useState(0)
  const [painelPecas, setPainelPecas] = useState(0)
  const [painelTaxa, setPainelTaxa] = useState(0)
  const [ehTaxa, setEhTaxa] = useState(false)
  const [painelObs, setPainelObs] = useState('')
  const [salvandoOS, setSalvandoOS] = useState(false)
  const [tecnicos, setTecnicos] = useState([])
  const [comissoes, setComissoes] = useState({})

  // verifica se é a 1a taxa do dia para esse tecnico (consultando OS ja concluidas com eh_taxa=true na mesma data)
  async function ehPrimeiraTaxaDoDia(tecnicoId, data){
    if(!tecnicoId || !data) return true
    const { count } = await supabase.from('ordens_servico')
      .select('id', { count: 'exact', head: true })
      .eq('tecnico_id', tecnicoId).eq('eh_taxa', true).eq('status','concluida')
      .eq('data_conclusao', data)
    return !count || count === 0
  }

  async function confirmarOS() {
    if(!painelOS) return
    setSalvandoOS(true)
    const hoje = new Date().toISOString().split('T')[0]
    const tecnicoId = painelOS.tecnico_id
    const pctTecnico = painelOS.usuarios?.comissao_percentual || 0
    const isClaudio = pctTecnico === 0 // Claudio fica com 0% configurado = 100% empresa

    let valorFinal, valorMaoObra, valorPecasFinal, ehTaxaFinal

    if (ehTaxa) {
      // MODO TAXA — substitui o valor
      valorFinal = Number(painelTaxa) || 0
      valorPecasFinal = 0
      ehTaxaFinal = true
      // mao_obra usado so para guardar quanto foi pro tecnico (informativo)
      if (isClaudio) {
        valorMaoObra = 0 // tudo fica na empresa, nao ha split
      } else {
        const primeira = await ehPrimeiraTaxaDoDia(tecnicoId, hoje)
        valorMaoObra = primeira ? 0 : valorFinal // se for a 1a do dia, tecnico nao leva nada da taxa; senao guarda o valor total da taxa pra calcular 50/50 depois
      }
    } else {
      // MODO NORMAL — desconta pecas, divide mao de obra
      const total = Number(painelValor) || 0
      const pecas = Number(painelPecas) || 0
      valorFinal = total
      valorPecasFinal = pecas
      ehTaxaFinal = false
      valorMaoObra = Math.max(total - pecas, 0)
    }

    await supabase.from('ordens_servico').update({
      status: 'concluida',
      data_conclusao: hoje,
      valor: valorFinal,
      valor_pecas: valorPecasFinal,
      valor_taxa: ehTaxaFinal ? valorFinal : 0,
      eh_taxa: ehTaxaFinal,
      valor_mao_obra: valorMaoObra,
      observacoes: painelObs || painelOS.observacoes,
    }).eq('id', painelOS.id)

    setSalvandoOS(false)
    setPainelOS(null); setPainelValor(0); setPainelPecas(0); setPainelTaxa(0); setEhTaxa(false); setPainelObs('')
    loadData(user)
  }

  async function buscarPorData(data){
    if(!data){setOsFiltradas([]);setAgendaFiltroData('');return}
    setBuscandoFiltro(true)
    const {data:os}=await supabase.from('ordens_servico')
      .select('id,numero,cliente_nome,cliente_telefone,cliente_endereco,bairro,produto,servico,descricao,periodo,status,data_entrada,valor,observacoes,tecnico_id,usuarios(nome,comissao_percentual)')
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
  const lucro=stats.fat-stats.desp
  const ticket=stats.concluidas?stats.fat/stats.concluidas:0
  const maxVal=Math.max(...stats.meses.map(([,v])=>v),1)
  const ausentes=CARDS_DEFAULT.filter(c=>!draft.find(d=>d.id===c.id))

  const cardVal={
    faturamento:{v:fmt(stats.fat),sub:'OS concluídas',c:null,hl:false},
    despesas:{v:fmt(stats.desp),sub:'gastos da empresa',c:'#A32D2D',hl:false},
    lucro:{v:fmt(lucro),sub:'fat − despesas',c:lucro>=0?t.accent:'#A32D2D',hl:true},
    ticket:{v:fmt(ticket),sub:'por serviço',c:null,hl:false},
    clientes:{v:stats.clientes,sub:null,c:null,hl:false},
    andamento:{v:stats.andamento,sub:null,c:'#854F0B',hl:false},
    concluidas:{v:stats.concluidas,sub:null,c:'#3B6D11',hl:false},
    hoje:{v:stats.hoje,sub:'serviços',c:stats.hoje>0?t.accent:null,hl:false},
  }

  const colSpan=tam=>{ if(isMobile)return'1/-1'; if(tam==='largo')return'1/-1'; if(tam==='medio')return'span 2'; return'span 1' }

  function AgendaCard({os, destaque, atrasado}) {
    const [exp, setExp] = useState(false)
    const data = os.data_entrada ? new Date(os.data_entrada+'T12:00') : null
    const diasRestantes = data ? Math.round((data - new Date().setHours(0,0,0,0)) / 86400000) : null
    const corDestaque = atrasado ? '#A32D2D' : t.accent
    const bgDestaque = atrasado ? (t.dark?'#2a1a1a':'#fdf0f0') : (t.dark?'#1a2a1a':'#f0faf0')
    // bairro curto — tira o prefixo da cidade (ex: "Sao Jose dos Pinhais - Afonso Pena" → "Afonso Pena")
    const bairroShort = os.bairro ? os.bairro.split(' - ').pop() : ''
    const Detalhes = () => (
      <div style={{margin:'0 12px 10px',padding:'10px 12px',borderRadius:8,background:t.bgCard,fontSize:12,color:t.textSoft,display:'flex',flexDirection:'column',gap:5}}>
        {os.cliente_telefone&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Telefone:</span>{os.cliente_telefone}</div>}
        {os.cliente_endereco&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Endereço:</span>{os.cliente_endereco}</div>}
        {os.bairro&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Bairro:</span>{os.bairro}</div>}
        {os.descricao&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Diagnóstico:</span>{os.descricao}</div>}
        {os.observacoes&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Obs:</span>{os.observacoes}</div>}
        {os.valor>0&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Valor:</span><strong style={{color:t.accent}}>{fmt(os.valor)}</strong></div>}
      </div>
    )

    if(isMobile) return (
      <div style={{borderRadius:10,marginBottom:8,background:destaque?bgDestaque:t.bgSidebar,border:destaque?'1px solid '+corDestaque:'1px solid '+t.borderSoft}}>
        <div onClick={()=>setExp(!exp)} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',cursor:'pointer'}}>
          {atrasado&&<span style={{fontSize:14,flexShrink:0}}>⚠</span>}
          <div style={{textAlign:'center',flexShrink:0,width:32}}>
            <div style={{fontSize:16,fontWeight:700,color:destaque?corDestaque:t.textSoft,lineHeight:1}}>{data?data.getDate():'—'}</div>
            <div style={{fontSize:9,color:t.textSoft,textTransform:'uppercase'}}>{data?data.toLocaleDateString('pt-BR',{month:'short'}):''}</div>
          </div>
          <div style={{width:2,height:30,background:destaque?corDestaque:t.borderSoft,borderRadius:99,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,color:t.text,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{os.cliente_nome||'—'}</div>
            <div style={{fontSize:11,color:t.textSoft,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {[os.produto||os.servico, bairroShort, os.periodo?PERIODOS[os.periodo]:null].filter(Boolean).join(' · ')}
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textSoft} strokeWidth="2" style={{transform:exp?'rotate(180deg)':'none',transition:'transform .2s',flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        {exp&&<Detalhes/>}
        <div style={{padding:'0 12px 10px'}}>
          <button onClick={()=>{setPainelOS(os);setPainelValor(os.valor||0);setPainelObs(os.observacoes||'')}} style={{width:'100%',padding:'8px 14px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:600}}>
            ✓ Confirmar
          </button>
        </div>
      </div>
    )

    // DESKTOP
    const diasAtras = atrasado && data ? Math.abs(diasRestantes) : null
    return (
      <div style={{borderRadius:10,marginBottom:8,background:destaque?bgDestaque:t.bgSidebar,border:destaque?'1px solid '+corDestaque:'1px solid '+t.borderSoft,overflow:'hidden'}}>
        <div onClick={()=>setExp(!exp)} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',cursor:'pointer'}}>
          <div style={{textAlign:'center',flexShrink:0,width:44}}>
            <div style={{fontSize:destaque?20:16,fontWeight:700,color:destaque?corDestaque:t.textSoft,lineHeight:1}}>{data?data.getDate():'—'}</div>
            <div style={{fontSize:10,color:t.textSoft,textTransform:'uppercase'}}>{data?data.toLocaleDateString('pt-BR',{month:'short'}):''}</div>
          </div>
          <div style={{width:2,height:36,background:destaque?corDestaque:t.borderSoft,borderRadius:99,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,color:t.text,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{os.cliente_nome||'—'}</div>
            <div style={{fontSize:11,color:t.textSoft,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{os.produto||os.servico||'—'}{os.bairro?' · '+os.bairro:''}</div>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}>
            {os.periodo&&<div style={{fontSize:11,fontWeight:600,color:destaque?corDestaque:t.textSoft,marginBottom:2}}>{PERIODOS[os.periodo]||os.periodo}</div>}
            <div style={{fontSize:11,color:t.textSoft}}>{os.usuarios?.nome||'Sem técnico'}</div>
          </div>
          {atrasado&&diasAtras>0&&<div style={{background:'#FCEBEB',border:'1px solid #f0c0c0',borderRadius:6,padding:'2px 8px',fontSize:11,color:'#A32D2D',flexShrink:0,fontWeight:600}}>há {diasAtras}d</div>}
          {!atrasado&&diasRestantes!==null&&diasRestantes>0&&<div style={{background:t.bgCard,border:'1px solid '+t.borderSoft,borderRadius:6,padding:'2px 8px',fontSize:11,color:t.textSoft,flexShrink:0}}>em {diasRestantes}d</div>}
          {atrasado?<div style={{background:'#A32D2D',color:'#fff',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600,flexShrink:0}}>ATRASADO</div>:(destaque&&<div style={{background:t.accent,color:'#fff',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600,flexShrink:0}}>HOJE</div>)}
          <button onClick={e=>{e.stopPropagation();setPainelOS(os);setPainelValor(os.valor||0);setPainelObs(os.observacoes||'')}} style={{padding:'5px 12px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:11,cursor:'pointer',fontWeight:600,flexShrink:0,whiteSpace:'nowrap'}}>
            ✓ Confirmar
          </button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textSoft} strokeWidth="2" style={{transform:exp?'rotate(180deg)':'none',transition:'transform .2s',flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
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
    const baseStyle={background:t.bgCard,border:'1px solid '+(isOver?t.accent:t.border),borderRadius:12,overflow:'hidden',gridColumn:colSpan(card.tamanho),opacity:isDragging?0.4:1,position:'relative',cursor:edit?'grab':'default'}
    const dragProps=edit?{draggable:true,onDragStart:()=>dgStart(idx),onDragOver:e=>dgOver(e,idx),onDrop:e=>dgDrop(e,idx),onDragEnd:dgEnd}:{}

    // AGENDA
    if(card.id==='agenda'){
      return (
        <div key={card.id} {...dragProps} style={baseStyle}>
          {edit&&<EditOverlay card={card} t={t} onRemove={()=>remover(card.id)} onTam={tam=>setTam(card.id,tam)}/>}
          <div style={{padding:'14px 18px',borderBottom:'1px solid '+t.borderSoft,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
            <span style={{fontSize:14,fontWeight:600,color:t.text}}>Agenda de serviços</span>
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
                          <button onClick={()=>{setPainelOS({...o,tecnico_id:o.tecnico_id});setPainelValor(o.valor||0);setPainelMaoObra(o.valor_mao_obra||0);setPainelObs(o.observacoes||'')}} style={{padding:'5px 10px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:11,cursor:'pointer',fontWeight:600,flexShrink:0,whiteSpace:'nowrap'}}>
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

    // CARD SIMPLES
    if(!d) return null
    return (
      <div key={card.id} {...dragProps} style={{...baseStyle,padding:'16px 18px',border:'1px solid '+(isOver?t.accent:d.hl?t.accent:t.border)}}>
        {edit&&<EditOverlay card={card} t={t} onRemove={()=>remover(card.id)} onTam={tam=>setTam(card.id,tam)}/>}
        <div style={{fontSize:12,color:t.textSoft,marginBottom:6}}>{card.label}</div>
        <div style={{fontSize:isMobile?18:card.tamanho==='pequeno'?18:24,fontWeight:700,color:d.c||t.text}}>{d.v}</div>
        {d.sub&&<div style={{fontSize:11,color:t.textSoft,marginTop:4}}>{d.sub}</div>}
      </div>
    )
  }

  const fmt2 = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})

  return (
    <Layout title={isGestor?'Dashboard':'Meus Serviços'}>
      {/* MINI PAINEL CONFIRMAR SERVIÇO */}
      {painelOS&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:t.bgCard,borderRadius:'16px 16px 0 0',padding:20,width:'100%',maxWidth:500,border:'1px solid '+t.border,maxHeight:'88vh',overflow:'auto'}}>
            <div style={{fontSize:15,fontWeight:600,color:t.text,marginBottom:4}}>Confirmar serviço</div>
            <div style={{fontSize:13,color:t.textSoft,marginBottom:14}}>{painelOS.cliente_nome} · {painelOS.produto||painelOS.servico||'—'}</div>

            {/* TOGGLE NORMAL / TAXA */}
            <div style={{display:'flex',gap:6,marginBottom:16,background:t.bgSidebar,padding:4,borderRadius:10}}>
              <button onClick={()=>setEhTaxa(false)} style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:!ehTaxa?t.accent:'transparent',color:!ehTaxa?'#fff':t.textSoft,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                ✓ Serviço aprovado
              </button>
              <button onClick={()=>setEhTaxa(true)} style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:ehTaxa?'#854F0B':'transparent',color:ehTaxa?'#fff':t.textSoft,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                Só taxa de visita
              </button>
            </div>

            {!ehTaxa ? (
              <>
                <div style={{marginBottom:12}}>
                  <label style={{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}}>Valor total cobrado (R$)</label>
                  <input type="number" style={{width:'100%',padding:'12px',borderRadius:8,border:'1px solid '+t.border,fontSize:18,fontFamily:'inherit',background:t.bgInput,color:t.text,fontWeight:600}} value={painelValor} onChange={e=>setPainelValor(e.target.value)} placeholder="0"/>
                </div>
                <div style={{marginBottom:12}}>
                  <label style={{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}}>Valor de peças usadas (R$)</label>
                  <input type="number" style={{width:'100%',padding:'12px',borderRadius:8,border:'1px solid '+t.border,fontSize:18,fontFamily:'inherit',background:t.bgInput,color:t.text,fontWeight:600}} value={painelPecas} onChange={e=>setPainelPecas(e.target.value)} placeholder="0"/>
                </div>
                {(() => {
                  const total = Number(painelValor)||0
                  const pecas = Number(painelPecas)||0
                  const maoObra = Math.max(total-pecas,0)
                  const pct = painelOS.usuarios?.comissao_percentual||0
                  return (
                    <div style={{padding:'10px 12px',borderRadius:8,background:t.bgSidebar,fontSize:12,marginBottom:16}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:t.textSoft}}>Mão de obra (total − peças)</span><strong style={{color:t.text}}>R$ {maoObra.toFixed(2)}</strong></div>
                      {pct>0?(
                        <>
                          <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:t.textSoft}}>Para {painelOS.usuarios?.nome} ({pct}%)</span><strong style={{color:t.accent}}>R$ {(maoObra*pct/100).toFixed(2)}</strong></div>
                          <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:t.textSoft}}>Para empresa</span><strong style={{color:t.text}}>R$ {(maoObra*(1-pct/100)).toFixed(2)}</strong></div>
                        </>
                      ):(
                        <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:t.textSoft}}>Para empresa (100%)</span><strong style={{color:t.text}}>R$ {maoObra.toFixed(2)}</strong></div>
                      )}
                    </div>
                  )
                })()}
              </>
            ) : (
              <>
                <div style={{marginBottom:12}}>
                  <label style={{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}}>Valor da taxa (R$)</label>
                  <input type="number" style={{width:'100%',padding:'12px',borderRadius:8,border:'1px solid #854F0B',fontSize:18,fontFamily:'inherit',background:t.bgInput,color:t.text,fontWeight:600}} value={painelTaxa} onChange={e=>setPainelTaxa(e.target.value)} placeholder="40"/>
                </div>
                <div style={{padding:'10px 12px',borderRadius:8,background:'#FAEEDA',fontSize:12,color:'#854F0B',marginBottom:16}}>
                  {(painelOS.usuarios?.comissao_percentual||0)===0
                    ? 'Esta taxa fica 100% para a empresa.'
                    : 'Se for a 1ª taxa do dia desse técnico, fica 100% empresa. Da 2ª em diante, divide 50/50 com o técnico.'}
                </div>
              </>
            )}

            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}}>Observações (não aparece no recibo)</label>
              <textarea style={{width:'100%',padding:'10px',borderRadius:8,border:'1px solid '+t.border,fontSize:14,fontFamily:'inherit',background:t.bgInput,color:t.text,minHeight:60,resize:'vertical'}} value={painelObs} onChange={e=>setPainelObs(e.target.value)} placeholder="Ex: peças trocadas, garantia..."/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button style={{flex:1,padding:'14px',borderRadius:8,background:'transparent',border:'1px solid '+t.border,color:t.textSoft,fontSize:14,cursor:'pointer'}} onClick={()=>{setPainelOS(null);setEhTaxa(false)}}>Cancelar</button>
              <button style={{flex:2,padding:'14px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:14,cursor:'pointer',fontWeight:600,opacity:salvandoOS?0.7:1}} onClick={confirmarOS} disabled={salvandoOS}>
                {salvandoOS?'Salvando...':'✓ Marcar como concluído'}
              </button>
            </div>
          </div>
        </div>
      )}
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
            {[['Hoje',osHoje.length],['Esta semana',osFuturas.length],['Total',stats.andamento]].map(([l,v])=>(
              <div key={l} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:'12px 14px'}}><div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>{l}</div><div style={{fontSize:20,fontWeight:700,color:t.text}}>{v}</div></div>
            ))}
          </div>
          {osHoje.length>0&&(
            <div style={{fontSize:12,fontWeight:700,color:t.accent,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>
              Hoje — {osHoje.length} serviço{osHoje.length>1?'s':''}
            </div>
          )}
          {osHoje.map(o=>(
            <div key={o.id} style={{background:t.bgCard,border:'1px solid '+t.accent,borderRadius:12,padding:'14px',marginBottom:10}}>
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
                {o.descricao&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Diagnóstico:</span>{o.descricao}</div>}
                {o.observacoes&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Obs:</span>{o.observacoes}</div>}
                {o.data_entrada&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Data:</span>{new Date(o.data_entrada+'T12:00').toLocaleDateString('pt-BR')}</div>}
                {o.valor>0&&<div style={{display:'flex',gap:6}}><span style={{fontWeight:500,color:t.text,minWidth:70}}>Valor:</span><strong style={{color:t.accent}}>{fmt(o.valor)}</strong></div>}
              </div>
              <button onClick={()=>{setPainelOS(o);setPainelValor(o.valor||0);setPainelMaoObra(o.valor_mao_obra||0);setPainelObs(o.observacoes||'')}}
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
            <div key={o.id} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:'12px 14px',marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1,minWidth:0,marginRight:8}}>
                  <div style={{fontWeight:600,color:t.text,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.cliente_nome||'—'}</div>
                  <div style={{fontSize:12,color:t.textSoft,marginTop:2}}>{o.produto||o.servico||'—'}</div>
                  {o.bairro&&<div style={{fontSize:11,color:t.textSoft,marginTop:1}}>{o.bairro.split(' - ').pop()}</div>}
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  {o.periodo&&<div style={{fontSize:12,color:t.textSoft}}>{PERIODOS[o.periodo]||o.periodo}</div>}
                  <div style={{fontSize:11,color:t.textSoft,marginTop:2}}>{o.data_entrada?new Date(o.data_entrada+'T12:00').toLocaleDateString('pt-BR'):''}</div>
                </div>
              </div>
            </div>
          ))}
          {osHoje.length===0&&osFuturas.length===0&&<div style={{fontSize:13,color:t.textSoft,padding:16,textAlign:'center'}}>Nenhum serviço agendado.</div>}
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
