import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme, grad, GRADIENTES } from '../lib/theme'
import { Ico, BotaoIco, BotaoPill } from '../lib/icones'

function useIsMobile(){ const [m,setM]=useState(false); useEffect(()=>{const c=()=>setM(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);return m }

const PERIODOS = {manha:'Manhã', tarde:'Tarde', noite:'Noite'}
const hojeISO = () => new Date().toISOString().split('T')[0]
const fmtBR = d => d ? new Date(d+'T12:00').toLocaleDateString('pt-BR') : '—'

// CSS da folha de impressao: 2 colunas x 4 linhas por A4
const CSS_ETIQUETA = `
  @page { size: A4; margin: 8mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, sans-serif; margin:0; color:#111; }
  .folha { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
  .et {
    border: 1.5px dashed #999; border-radius: 4mm; padding: 4mm 4.5mm;
    height: 66mm; display: flex; flex-direction: column; page-break-inside: avoid;
  }
  .et-top { display:flex; justify-content:space-between; align-items:flex-start;
            border-bottom:1.5px solid #111; padding-bottom:2mm; margin-bottom:2.5mm; }
  .et-emp { font-size: 9pt; font-weight: 800; line-height:1.15; }
  .et-emp small { display:block; font-size:6.5pt; font-weight:400; color:#555; }
  .et-os { text-align:right; }
  .et-os b { display:block; font-size:15pt; font-weight:900; line-height:1; }
  .et-os small { font-size:6.5pt; color:#555; letter-spacing:.06em; }
  .et-cli { font-size: 12pt; font-weight: 800; line-height:1.1; margin-bottom:1mm; }
  .et-tel { font-size: 9pt; color:#333; margin-bottom:2.5mm; }
  .lin { font-size: 8pt; margin-bottom: 1.8mm; }
  .lin b { display:block; font-size:6.5pt; text-transform:uppercase; letter-spacing:.07em; color:#777; margin-bottom:.4mm; }
  .lin span { font-size: 9pt; font-weight:600; }
  .et-serv { flex:1; overflow:hidden; }
  .et-serv ul { margin:.5mm 0 0; padding-left: 4mm; }
  .et-serv li { font-size: 8.5pt; margin-bottom: .6mm; }
  .et-rod { display:flex; justify-content:space-between; align-items:flex-end;
            border-top:1px solid #ccc; padding-top:1.8mm; margin-top:1.5mm; font-size:7.5pt; color:#555; }
  .et-data { font-weight:800; color:#111; font-size:9pt; }
  .tag { display:inline-block; border:1.2px solid #111; border-radius:2mm;
         padding:.6mm 2mm; font-size:7pt; font-weight:800; letter-spacing:.04em; }
`

export default function Etiquetas() {
  const [lista, setLista] = useState([])
  const [busca, setBusca] = useState('')
  const [sel, setSel] = useState({})           // id -> true
  const [tipo, setTipo] = useState('recolha')  // recolha | servico | entrega
  const [dataRecolha, setDataRecolha] = useState(hojeISO())
  const [carregando, setCarregando] = useState(true)
  const [empresa, setEmpresa] = useState({nome:'Top Eletro - Inova', telefone:'(41) 99846-1851 / 3206-7414'})
  const { t } = useTheme()
  const isMobile = useIsMobile()

  useEffect(()=>{
    supabase.from('empresa').select('*').single().then(({data})=>{ if(data) setEmpresa(p=>({...p,...data})) })
    supabase.from('ordens_servico')
      .select('id,numero,cliente_nome,cliente_telefone,cliente_endereco,bairro,produto,servico,descricao,relato_cliente,periodo,status,data_entrada,usuarios(nome)')
      .order('data_entrada',{ascending:false}).limit(400)
      .then(({data})=>{ setLista(data||[]); setCarregando(false) })
  },[])

  const TIPOS = {
    recolha: { rotulo:'Recolhimento',  tag:'RECOLHIDO',   campoData:'Data da recolha' },
    servico: { rotulo:'Em serviço',    tag:'EM SERVIÇO',  campoData:'Entrada na oficina' },
    entrega: { rotulo:'Pronto/entrega',tag:'PRONTO',      campoData:'Data de conclusão' },
  }

  const filtradas = lista.filter(o=>{
    const q = busca.toLowerCase()
    if(!q) return true
    return (o.cliente_nome||'').toLowerCase().includes(q)
      || (o.produto||'').toLowerCase().includes(q)
      || String(o.numero).includes(q)
      || (o.bairro||'').toLowerCase().includes(q)
  })
  const escolhidas = lista.filter(o=>sel[o.id])

  function alternar(id){ setSel(s=>({...s,[id]:!s[id]})) }
  function marcarTodas(){
    const novo={}; filtradas.forEach(o=>novo[o.id]=true); setSel(novo)
  }
  function limpar(){ setSel({}) }

  function linhasServico(o){
    const l = String(o.servico||'').split('\n').map(x=>x.trim().replace(/^[-•]\s*/,'')).filter(Boolean)
    if(l.length) return l
    if(o.descricao) return [o.descricao]
    if(o.relato_cliente) return [o.relato_cliente]
    return ['—']
  }

  function htmlEtiqueta(o){
    const T = TIPOS[tipo]
    const servs = linhasServico(o).slice(0,5)
    const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    return `
      <div class="et">
        <div class="et-top">
          <div class="et-emp">${esc(empresa.nome)}<small>${esc(empresa.telefone||'')}</small></div>
          <div class="et-os"><b>${esc(o.numero)}</b><small>ORDEM Nº</small></div>
        </div>
        <div class="et-cli">${esc(o.cliente_nome||'—')}</div>
        <div class="et-tel">${esc(o.cliente_telefone||'')}${o.bairro?' · '+esc(o.bairro):''}</div>
        <div class="lin"><b>Aparelho</b><span>${esc(o.produto||'—')}</span></div>
        <div class="lin et-serv"><b>Serviço</b><ul>${servs.map(s=>'<li>'+esc(s)+'</li>').join('')}</ul></div>
        <div class="et-rod">
          <div><b style="display:block;font-size:6.5pt;text-transform:uppercase;letter-spacing:.07em;color:#777">${T.campoData}</b>
            <span class="et-data">${fmtBR(tipo==='recolha'?dataRecolha:o.data_entrada)}</span></div>
          <div style="text-align:right">
            <div style="margin-bottom:1mm">${esc(o.usuarios?.nome||'')}</div>
            <span class="tag">${T.tag}</span>
          </div>
        </div>
      </div>`
  }

  function imprimir(){
    if(!escolhidas.length){ alert('Escolha pelo menos uma OS.'); return }
    const j = window.open('','_blank','width=900,height=700')
    j.document.write('<html><head><title>Etiquetas</title><style>'+CSS_ETIQUETA+'</style></head><body><div class="folha">'
      + escolhidas.map(htmlEtiqueta).join('') + '</div></body></html>')
    j.document.close()
    setTimeout(()=>j.print(), 500)
  }

  const cardSel = {background:t.bgCard,border:'1px solid '+t.borderSoft,borderRadius:16,boxShadow:t.shadow}

  return (
    <Layout title="Etiquetas">
      {/* ---------- controles ---------- */}
      <div style={{...cardSel,padding:'16px 18px',marginBottom:16}}>
        <div style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:t.textSoft,marginBottom:10}}>Tipo de etiqueta</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
          {Object.entries(TIPOS).map(([k,v])=>(
            <button key={k} className="sg-btn" onClick={()=>setTipo(k)}
              style={{padding:'10px 18px',borderRadius:999,cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700,
                      border:'1px solid '+(tipo===k?'transparent':t.border),
                      background:tipo===k?grad('os'):t.bgCard, color:tipo===k?'#fff':t.textSoft,
                      boxShadow:tipo===k?'0 6px 16px -6px '+GRADIENTES.os[1]+'99':'none'}}>
              {v.rotulo}
            </button>
          ))}
        </div>

        {tipo==='recolha'&&(
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',color:t.textSoft,marginBottom:6}}>Data da recolha</label>
            <input type="date" value={dataRecolha} onChange={e=>setDataRecolha(e.target.value)}
              style={{padding:'11px 14px',borderRadius:12,border:'1px solid '+t.border,background:t.bgInput,color:t.text,fontSize:14,fontFamily:'inherit'}}/>
          </div>
        )}

        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:180,display:'flex',alignItems:'center',gap:8,background:t.bgInput,border:'1px solid '+t.border,borderRadius:999,padding:'0 16px',height:44,color:t.textSoft}}>
            <Ico n="busca" size={16}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar cliente, aparelho, nº da OS..."
              style={{flex:1,border:'none',background:'transparent',outline:'none',fontSize:13.5,fontFamily:'inherit',color:t.text}}/>
          </div>
          <BotaoPill n="confirmar" t={t} onClick={marcarTodas}>Todas ({filtradas.length})</BotaoPill>
          {!!escolhidas.length&&<BotaoPill n="fechar" t={t} onClick={limpar}>Limpar</BotaoPill>}
        </div>
      </div>

      {/* ---------- barra fixa de impressao ---------- */}
      {!!escolhidas.length&&(
        <div style={{position:'sticky',top:isMobile?0:8,zIndex:15,marginBottom:14,
                     background:grad('os'),borderRadius:16,padding:'12px 16px',
                     display:'flex',alignItems:'center',gap:12,color:'#fff',
                     boxShadow:'0 10px 24px -8px '+GRADIENTES.os[1]+'aa'}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:800}}>{escolhidas.length} etiqueta{escolhidas.length>1?'s':''} selecionada{escolhidas.length>1?'s':''}</div>
            <div style={{fontSize:11.5,opacity:.9}}>{Math.ceil(escolhidas.length/8)} folha{Math.ceil(escolhidas.length/8)>1?'s':''} A4 · 8 por folha</div>
          </div>
          <button className="sg-btn" onClick={imprimir}
            style={{display:'inline-flex',alignItems:'center',gap:8,height:42,padding:'0 20px',borderRadius:999,
                    border:'none',background:'#fff',color:'#1a1a1a',fontSize:13.5,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
            <Ico n="imprimir" size={17}/>Imprimir
          </button>
        </div>
      )}

      {/* ---------- lista ---------- */}
      {carregando&&<div style={{padding:32,textAlign:'center',color:t.textSoft,fontSize:13}}>Carregando...</div>}
      <div style={{display:'flex',flexDirection:'column',gap:9}}>
        {filtradas.map(o=>{
          const on = !!sel[o.id]
          return (
            <div key={o.id} onClick={()=>alternar(o.id)} className="sg-card"
              style={{...cardSel,padding:'12px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:12,
                      border:'1px solid '+(on?t.accent:t.borderSoft)}}>
              <div style={{width:26,height:26,borderRadius:9,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
                           border:'2px solid '+(on?'transparent':t.border), background:on?grad('os'):'transparent',color:'#fff'}}>
                {on&&<Ico n="confirmar" size={15}/>}
              </div>
              <div style={{width:44,textAlign:'center',flexShrink:0}}>
                <div style={{fontSize:15,fontWeight:800,color:t.text,fontVariantNumeric:'tabular-nums',lineHeight:1}}>{o.numero}</div>
                <div style={{fontSize:8.5,color:t.textSoft,textTransform:'uppercase',letterSpacing:'.05em',marginTop:2}}>OS</div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:t.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.cliente_nome||'—'}</div>
                <div style={{fontSize:11.5,color:t.textSoft,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {[o.produto, o.bairro, fmtBR(o.data_entrada)].filter(Boolean).join(' · ')}
                </div>
              </div>
              {o.status==='concluida'
                ? <span style={{fontSize:9.5,fontWeight:800,color:'#2E7A3E',background:'#E4F1E1',borderRadius:999,padding:'3px 9px',flexShrink:0}}>PRONTA</span>
                : <span style={{fontSize:9.5,fontWeight:800,color:'#9A5F0C',background:'#F7ECD9',borderRadius:999,padding:'3px 9px',flexShrink:0}}>ABERTA</span>}
            </div>
          )
        })}
        {!carregando&&filtradas.length===0&&<div style={{padding:32,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhuma OS encontrada.</div>}
      </div>
    </Layout>
  )
}
