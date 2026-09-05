import { useEffect, useState, useRef } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { useRouter } from 'next/router'
import { TextoFormatado, MARCADORES, aplicarMarca } from '../lib/texto'
import { gerarReciboPNG, canvasParaArquivo, baixarCanvas } from '../lib/recibo-imagem'

// Vai junto com o recibo, na mesma mensagem do WhatsApp.
// Opcoes de garantia do selo. dias=0 significa "sem garantia".
export const GARANTIAS = [
  { dias: 30,  rotulo: '30 dias' },
  { dias: 90,  rotulo: '90 dias' },
  { dias: 180, rotulo: '6 meses' },
  { dias: 365, rotulo: '1 ano' },
  { dias: 0,   rotulo: 'Sem garantia' },
]

/** Soma os dias na data e devolve dd/mm/aaaa. */
function validadeGarantia(dataBase, dias) {
  if (!dataBase || !dias) return null
  const d = new Date(dataBase + 'T12:00')
  d.setDate(d.getDate() + Number(dias))
  return d.toLocaleDateString('pt-BR')
}

const MSG_AVALIACAO = `Esperamos que tenha ficado satisfeito(a) com o nosso atendimento!

Se puder, nos ajude de duas formas rápidas:

⭐ Deixe uma avaliação no Google:
👉 https://maps.app.goo.gl/GtpmLQAwaXmp42Jw6

📲 Nos siga no Instagram:
👉 https://www.instagram.com/topeletrorefrigeracao

Leva menos de 1 minutinho e faz toda a diferença pra gente!

Obrigado pela confiança na Inova Top Eletro! 🙏`

const LOGO_SRC = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAICAgICAgQCAgQGBAQEBggGBgYGCAoICAgICAoMCgoKCgoKDAwMDAwMDAwODg4ODg4QEBAQEBISEhISEhISEhL/2wBDAQMDAwUEBQgEBAgTDQsNExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExP/wAARCAFAAUADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAKqgMBmnk4r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"

// FORA do componente principal — se ficar dentro, o React recria a cada tecla
// e o campo perde o foco.
function CampoServico({ valor, onChange, sugestoes, cor }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const v = valor || ''

  function marcar(marca) {
    const el = ref.current
    if (!el) return
    const r = aplicarMarca(v, el.selectionStart, el.selectionEnd, marca)
    onChange(r.valor)
    setTimeout(() => { el.focus(); el.setSelectionRange(r.inicio, r.fim) }, 0)
  }
  // filtra pelo que esta sendo digitado na LINHA ATUAL
  const linhas = v.split('\n')
  const linhaAtual = (linhas[linhas.length - 1] || '').trim().toLowerCase()
  const filtradas = sugestoes
    .filter(s => !linhaAtual || s.toLowerCase().includes(linhaAtual))
    .filter(s => s.toLowerCase() !== linhaAtual)
    .slice(0, 8)

  function escolher(s) {
    const l = v.split('\n')
    l[l.length - 1] = s              // troca a linha atual pela sugestao
    onChange(l.join('\n') + '\n')    // ja pula pra proxima linha
    setAberto(true)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display:'flex', gap:5, marginTop:4, marginBottom:4, alignItems:'center' }}>
        {MARCADORES.map(m => (
          <button key={m.chave} type="button" title={m.chave} onMouseDown={e => e.preventDefault()}
            onClick={() => marcar(m.marca)}
            style={{ width:28, height:26, borderRadius:6, border:'1px solid '+cor, background:'#fff',
                     color:'#1a1a1a', cursor:'pointer', fontSize:12, fontFamily:'inherit', ...m.estilo }}>
            {m.rotulo}
          </button>
        ))}
        <span style={{ fontSize:10.5, color:'#999' }}>selecione o texto e clique</span>
      </div>
      <textarea
        ref={ref}
        value={v}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 180)}
        placeholder={'Uma linha por servico. Ex:\nTroca de motor\nCarga de gas'}
        style={{ width:'100%', padding:'8px 10px', borderRadius:6, border:'1px solid '+cor, fontSize:13,
                 fontFamily:'inherit', marginTop:4, minHeight:80, resize:'vertical', lineHeight:1.5 }}
      />
      {aberto && filtradas.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
          {filtradas.map(s => (
            <button key={s} type="button" onMouseDown={e => e.preventDefault()} onClick={() => escolher(s)}
              style={{ padding:'5px 11px', borderRadius:999, border:'1px solid '+cor, background:'#fff',
                       color:'#1a1a1a', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Linha do recibo. Se o valor estiver vazio, NAO renderiza nada —
// e o que deixa o recibo curto quando a OS tem pouca informacao.
function Linha({ rotulo, valor, forte, formatado }) {
  const v = String(valor == null ? '' : valor).trim()
  if (!v || v === '-' || v === '—') return null
  return (
    <div className="rec-linha">
      <span className="rec-rot">{rotulo}</span>
      <span className="rec-val" style={forte ? { fontWeight: 700, fontSize: 15 } : undefined}>
        {formatado ? <TextoFormatado texto={v}/> : v}
      </span>
    </div>
  )
}

// Lista de servicos em bullets. Some se nao houver nenhum.
function LinhaServicos({ texto }) {
  const itens = String(texto || '').split('\n').map(s => s.trim().replace(/^[-•]\s*/, '')).filter(Boolean)
  if (!itens.length) return null
  return (
    <div className="rec-linha">
      <span className="rec-rot">{itens.length > 1 ? 'Serviços realizados' : 'Serviço realizado'}</span>
      {itens.length === 1
        ? <span className="rec-val"><TextoFormatado texto={itens[0]}/></span>
        : <ul className="rec-ul">{itens.map((s, i) => <li key={i}><TextoFormatado texto={s}/></li>)}</ul>}
    </div>
  )
}

// CSS do recibo — usado na tela E na impressao (mesmo visual nos dois)
const CSS_RECIBO = `
.rec{max-width:420px;margin:0 auto;background:#fff;color:#16150f;border-radius:22px;overflow:hidden;
     font-family:var(--fonte-sg),-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
     box-shadow:0 18px 45px -20px rgba(0,0,0,.28)}
.rec-topo{padding:30px 24px 24px;text-align:center;background:linear-gradient(160deg,#1D9E75,#137a58);color:#fff}
.rec-check{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.2);margin:0 auto 14px;
           display:flex;align-items:center;justify-content:center}
.rec-check svg{width:28px;height:28px;stroke:#fff;stroke-width:2.6;fill:none;stroke-linecap:round;stroke-linejoin:round}
.rec-status{font-size:12.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.92}
.rec-valor{font-size:38px;font-weight:800;letter-spacing:-.02em;margin:6px 0 2px;font-variant-numeric:tabular-nums}
.rec-emp{font-size:13.5px;font-weight:700;margin-top:12px}
.rec-sub{font-size:11.5px;opacity:.85;margin-top:2px;line-height:1.45}
.rec-serrilha{height:22px;background:#fff;position:relative}
.rec-serrilha:before{content:'';position:absolute;top:50%;left:18px;right:18px;
                     border-top:2px dashed #d8d5cc;transform:translateY(-50%)}
.rec-corpo{padding:6px 24px 4px;background:#fff}
.rec-linha{padding:11px 0;border-bottom:1px solid #f1efe9}
.rec-linha:last-child{border-bottom:none}
.rec-rot{display:block;font-size:9.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#9c988c;margin-bottom:3px}
.rec-val{display:block;font-size:14px;line-height:1.45;color:#16150f;white-space:pre-wrap;word-break:break-word}
.rec-ul{margin:2px 0 0;padding-left:17px}
.rec-ul li{font-size:14px;line-height:1.5;margin-bottom:2px}
.rec-rodape{padding:16px 24px 22px;background:#faf9f6;border-top:1px solid #f1efe9;
            display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}
.rec-rod-item{font-size:11px}
.rec-rod-item b{display:block;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9c988c;margin-bottom:2px}
.rec-rod-item span{font-size:12.5px;font-weight:600;color:#16150f}
.rec-garantia{padding:0 22px 14px;background:#faf9f6;display:flex;justify-content:center}
.rec-gar-selo{display:inline-flex;align-items:center;gap:11px;border:2px solid #1D9E75;border-radius:14px;
              padding:10px 16px;background:#f2fbf7}
.rec-gar-selo svg{width:26px;height:26px;stroke:#1D9E75;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
.rec-gar-selo b{display:block;font-size:12.5px;font-weight:800;color:#137a58;letter-spacing:.04em}
.rec-gar-selo span{display:block;font-size:10.5px;color:#4b8f77;margin-top:1px}
.rec-obrigado{text-align:center;font-size:11px;color:#9c988c;padding:2px 22px 20px;background:#faf9f6;line-height:1.6}
.rec-end{margin-bottom:4px}
.rec-thanks{margin-top:10px;font-size:12.5px;font-weight:700;color:#1D9E75}
.rec-selo{display:inline-block;background:#F7ECD9;color:#9A5F0C;border-radius:999px;
          padding:3px 10px;font-size:9.5px;font-weight:800;letter-spacing:.05em;margin-top:8px}
@media print{
  body{margin:0;padding:0;background:#fff}
  .rec{box-shadow:none;max-width:100%;border-radius:0}
  .rec-topo{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{size:80mm auto;margin:4mm}
}
`

export default function Recibo() {
  const [os, setOs] = useState(null)
  const [form, setForm] = useState(null)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [servicosSalvos, setServicosSalvos] = useState([])
  const [empresa, setEmpresa] = useState({
    nome:'Top Eletro - Inova',
    cnpj:'82.668.070/0001-87',
    cidade:'R. Prof. João Soares Barcelos, 2273 - Lj 02 - Boqueirão, Curitiba - PR, 81670-080',
    telefone:'(41) 99846-1851 / 3206-7414',
    email:'tecnicainova@outlook.com',
  })
  const [gerando, setGerando] = useState(false)
  const { t } = useTheme()
  const router = useRouter()

  // servicos que a empresa ja fez — vira a lista de sugestoes
  useEffect(()=>{
    supabase.from('ordens_servico').select('servico').not('servico','is',null).limit(1500).then(({data})=>{
      const conta={}
      ;(data||[]).forEach(o=>{
        String(o.servico||'').split('\n').forEach(linha=>{
          const s=linha.trim()
          if(s.length>2) conta[s]=(conta[s]||0)+1
        })
      })
      // mais usados primeiro
      setServicosSalvos(Object.entries(conta).sort((a,b)=>b[1]-a[1]).map(([s])=>s))
    })
  },[])

  useEffect(()=>{
    supabase.from('empresa').select('*').single().then(({data})=>{ if(data) setEmpresa(prev=>({...prev,...data})) })
    if(router.query.os){
      supabase.from('ordens_servico').select('*, usuarios(nome)').eq('id',router.query.os).single().then(({data})=>{ if(data){ setOs(data); setForm(data) } })
    }
  },[router.query])

  function carregarOS(o){ setOs(o); setForm(o); setEditando(false) }
  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const fmtDate = d => d ? new Date(d+'T12:00').toLocaleDateString('pt-BR') : '-'
  function up(campo,valor){ setForm({...form,[campo]:valor}) }

  function formatarTelBR(tel) {
    let num = (tel||'').replace(/[^0-9]/g,'')
    if(num.startsWith('55')) num=num.slice(2)
    if(num.length===10) num=num.slice(0,2)+'9'+num.slice(2)
    return '55'+num
  }

  async function salvarNaOS() {
    setSalvando(true)
    const mudancas=[]
    const campos={cliente_nome:'Nome',cliente_telefone:'Telefone',cliente_endereco:'Endereco',produto:'Produto',servico:'Servico',relato_cliente:'Relato',descricao:'Descricao',valor:'Valor',observacoes:'Obs',garantia_dias:'Garantia'}
    for(const [k,label] of Object.entries(campos)){
      if(String(os[k]||'')!==String(form[k]||'')) mudancas.push(label+': "'+( os[k]||'-')+'" -> "'+( form[k]||'-')+'"')
    }
    const agora=new Date().toLocaleString('pt-BR')
    const novoHist=mudancas.length?((os.historico_alteracoes?os.historico_alteracoes+'\n':'')+'['+agora+'] '+mudancas.join(' | ')):(os.historico_alteracoes||'')
    const {error}=await supabase.from('ordens_servico').update({
      cliente_nome:form.cliente_nome,cliente_telefone:form.cliente_telefone,
      cliente_endereco:form.cliente_endereco,produto:form.produto,
      servico:form.servico,relato_cliente:form.relato_cliente,descricao:form.descricao,
      valor:Number(form.valor)||0,observacoes:form.observacoes,
      garantia_dias:form.garantia_dias==null?null:Number(form.garantia_dias),
      alterada:mudancas.length?true:os.alterada,historico_alteracoes:novoHist,
    }).eq('id',os.id)
    setSalvando(false)
    if(!error){alert(mudancas.length?'Alteracoes salvas!':'Sem mudancas.');setOs({...form,alterada:mudancas.length?true:os.alterada,historico_alteracoes:novoHist});setEditando(false)}
    else alert('Erro ao salvar.')
  }


  // monta os dados que o desenho da imagem precisa
  function dadosImagem(){
    return {
      status: concluida ? 'Serviço concluído' : 'Recibo de serviço',
      valor: fmt(form.valor),
      numero: form.numero,
      alterada: !!os.alterada,
      subtitulo: 'OS Nº ' + form.numero + (empresa.cnpj ? '   ·   CNPJ ' + empresa.cnpj : ''),
      empresa: { nome: empresa.nome, endereco: empresa.cidade, telefone: empresa.telefone, email: empresa.email },
      campos: [
        { rotulo: 'Cliente',  valor: form.cliente_nome, forte: true },
        { rotulo: 'Telefone', valor: form.cliente_telefone },
        { rotulo: 'Endereço', valor: form.cliente_endereco },
        { rotulo: 'Aparelho', valor: form.produto, forte: true },
        { rotulo: 'Relato do cliente', valor: form.relato_cliente },
        { rotulo: 'Diagnóstico', valor: form.descricao },
      ],
      servicos: String(form.servico||'').split('\n').map(x=>x.trim().replace(/^[-•]\s*/,'')).filter(Boolean),
      rodape: [
        { rotulo: 'Técnico', valor: os.usuarios?.nome || '' },
        { rotulo: 'Atendimento', valor: form.data_entrada ? fmtDate(form.data_entrada) : '' },
        { rotulo: 'Concluído em', valor: dataFim ? fmtDate(dataFim) : '' },
      ],
      garantia: garantiaDias > 0 ? {
        rotulo: 'GARANTIA DE ' + garantiaRotulo.toUpperCase(),
        validade: validadeGarantia(dataFim, garantiaDias),
      } : null,
    }
  }

  const familiaFonte = typeof window!=='undefined'
    ? getComputedStyle(document.body).fontFamily : undefined

  // Nome do arquivo com o cliente. Tira acento e os caracteres que o
  // Windows/Android nao aceitam em nome de arquivo (\ / : * ? " < > |).
  function nomeArquivo(){
    const limpo = String(form.cliente_nome||'')
      .normalize('NFD').replace(/[̀-ͯ]/g,'')   // acentos
      .replace(/[\\/:*?"<>|]/g,'')                        // proibidos
      .replace(/\s+/g,' ').trim()
      .slice(0,60)
    // so o nome do cliente. Sem nome, cai pro numero da OS pra nao ficar sem titulo.
    return (limpo || 'Recibo OS ' + form.numero) + '.png'
  }

  async function baixarImagem(){
    setGerando(true)
    try{
      const cv = await gerarReciboPNG(dadosImagem(), familiaFonte)
      baixarCanvas(cv, nomeArquivo())
    }catch(e){ alert('Nao consegui gerar a imagem: '+e.message) }
    setGerando(false)
  }

  // Manda imagem + texto na MESMA mensagem usando o compartilhamento do celular.
  // No PC (que nao tem esse recurso) baixa a imagem e abre o WhatsApp com o texto.
  async function enviarWhatsApp(){
    setGerando(true)
    try{
      const cv = await gerarReciboPNG(dadosImagem(), familiaFonte)
      const arquivo = await canvasParaArquivo(cv, nomeArquivo())
      const texto = MSG_AVALIACAO

      if(arquivo && navigator.canShare && navigator.canShare({files:[arquivo]})){
        await navigator.share({ files:[arquivo], text: texto })
        setGerando(false)
        return
      }

      // sem compartilhamento nativo: baixa a imagem e abre a conversa com o texto
      baixarCanvas(cv, nomeArquivo())
      const tel = formatarTelBR(form.cliente_telefone)
      const url = tel.length>=12
        ? 'https://wa.me/'+tel+'?text='+encodeURIComponent(texto)
        : 'https://wa.me/?text='+encodeURIComponent(texto)
      setTimeout(()=>{
        window.open(url,'_blank')
        alert('A imagem do recibo foi baixada.\nNo WhatsApp que abriu, anexe a imagem junto com a mensagem.')
      },400)
    }catch(e){
      if(e && e.name==='AbortError'){ setGerando(false); return }  // usuario cancelou
      alert('Nao consegui enviar: '+e.message)
    }
    setGerando(false)
  }


  function EditField({campo,label,type,textarea,gridFull}){
    return <div style={gridFull?{gridColumn:'1/-1'}:{}}>
      <span style={{fontWeight:600,color:'#555'}}>{label}:</span>{' '}
      {editando
        ?textarea
          ?<textarea style={{width:'100%',padding:'6px 9px',borderRadius:6,border:'1px solid #1D9E75',fontSize:13,fontFamily:'inherit',marginTop:4,minHeight:50,resize:'vertical'}} value={form[campo]||''} onChange={e=>up(campo,e.target.value)}/>
          :<input type={type||'text'} style={{padding:'4px 8px',borderRadius:6,border:'1px solid #1D9E75',fontSize:13,fontFamily:'inherit',minWidth:140}} value={form[campo]||''} onChange={e=>up(campo,e.target.value)}/>
        :(type==='number'
            ?<span style={{color:'#333'}}>{fmt(form[campo])}</span>
            :<TextoFormatado texto={form[campo]||'-'} style={{color:'#333'}}/>)}
    </div>
  }

  const concluida = os && os.status === 'concluida'
  // garantia: vem da OS; se nunca foi definida, assume 90 dias (o padrao da casa)
  const garantiaDias = form && form.garantia_dias != null ? Number(form.garantia_dias) : 90
  const garantiaRotulo = (GARANTIAS.find(g => g.dias === garantiaDias) || {}).rotulo || (garantiaDias + ' dias')
  // 140 das 300 OS concluidas foram fechadas sem gravar data_conclusao.
  // Como o atendimento aqui e no mesmo dia, cai pra data de entrada em vez
  // de sumir do recibo. Se nao houver nenhuma das duas, a linha nao aparece.
  const dataFim = form ? (form.data_conclusao || (concluida ? form.data_entrada : null)) : null

  const s = {
    card:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:16,boxShadow:t.shadow,overflow:'hidden'},
    btnSm:{padding:'6px 14px',borderRadius:8,border:'1px solid '+t.border,fontSize:12,cursor:'pointer',background:t.bgCard,fontFamily:'inherit',fontWeight:500,color:t.text},
    search:{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit',background:t.bgInput,color:t.text,marginBottom:12},
    osItem:{padding:'10px 14px',border:'1px solid '+t.border,borderRadius:8,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13,background:t.bgSidebar,marginBottom:6},
  }

  return (
    <Layout title="Recibo">
      <div style={{maxWidth:720,margin:'0 auto'}}>
        {!os&&(
          <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:16,boxShadow:t.shadow,padding:24}}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:16,color:t.text}}>Selecionar Ordem de Servico</div>
            <OSSelector onSelect={carregarOS} t={t} s={s}/>
          </div>
        )}
        {os&&form&&(
          <>
            <div style={{display:'flex',gap:8,marginBottom:16,justifyContent:'flex-end',flexWrap:'wrap'}}>
              <button style={s.btnSm} onClick={()=>{setOs(null);setForm(null)}}>Trocar OS</button>
              {!editando&&<button style={s.btnSm} onClick={()=>setEditando(true)}>Editar campos</button>}
              {editando&&<button style={{...s.btnSm,background:t.accent,color:'#fff',border:'none'}} onClick={salvarNaOS} disabled={salvando}>{salvando?'Salvando...':'Salvar na OS'}</button>}
              {editando&&<button style={s.btnSm} onClick={()=>{setForm(os);setEditando(false)}}>Cancelar</button>}
              {!editando&&<button style={s.btnSm} onClick={baixarImagem} disabled={gerando}>{gerando?'Gerando...':'Baixar imagem'}</button>}
              {!editando&&<button style={{...s.btnSm,background:'#25D366',color:'#fff',border:'1px solid #25D366',fontWeight:700}} onClick={enviarWhatsApp} disabled={gerando}>
                {gerando?'Gerando...':'Enviar no WhatsApp'}
              </button>}
            </div>
            <style dangerouslySetInnerHTML={{__html: CSS_RECIBO}}/>

            {/* seletor de garantia — vale pro recibo e pra imagem */}
            {!editando&&(
              <div style={{maxWidth:420,margin:'0 auto 14px',background:t.bgCard,border:'1px solid '+t.borderSoft,
                           borderRadius:16,boxShadow:t.shadow,padding:'13px 15px'}}>
                <div style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'.07em',color:t.textSoft,marginBottom:9}}>Garantia do serviço</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {GARANTIAS.map(g=>{
                    const on = garantiaDias === g.dias
                    return (
                      <button key={g.dias} className="sg-btn" onClick={()=>up('garantia_dias',g.dias)}
                        style={{padding:'8px 14px',borderRadius:999,cursor:'pointer',fontFamily:'inherit',fontSize:12.5,fontWeight:700,
                                border:'1px solid '+(on?t.accent:t.border),
                                background:on?t.accent:t.bgCard, color:on?'#fff':t.textSoft}}>
                        {g.rotulo}
                      </button>
                    )
                  })}
                </div>
                {form.garantia_dias!==os.garantia_dias&&(
                  <button className="sg-btn" onClick={salvarNaOS} disabled={salvando}
                    style={{marginTop:10,width:'100%',padding:'10px',borderRadius:12,border:'none',background:t.accent,color:'#fff',
                            fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                    {salvando?'Salvando...':'Salvar garantia na OS'}
                  </button>
                )}
              </div>
            )}

            {editando ? (
              /* ---------- MODO EDICAO: formulario simples ---------- */
              <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:20,boxShadow:t.shadow,padding:20,maxWidth:520,margin:'0 auto'}}>
                <div style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:14}}>Editar campos do recibo</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <EditField campo="cliente_nome" label="Nome"/>
                  <EditField campo="cliente_telefone" label="Telefone"/>
                  <EditField campo="cliente_endereco" label="Endereco" gridFull/>
                  <EditField campo="produto" label="Produto/Equipamento" gridFull/>
                </div>
                <div style={{marginTop:12,fontSize:13}}>
                  <span style={{fontWeight:600,color:t.textSoft,fontSize:11,textTransform:'uppercase',letterSpacing:'.05em'}}>Servico realizado</span>
                  <CampoServico valor={form.servico} onChange={v=>up('servico',v)} sugestoes={servicosSalvos} cor={t.accent}/>
                </div>
                <div style={{marginTop:12,fontSize:13}}><EditField campo="relato_cliente" label="Relato do cliente" textarea/></div>
                <div style={{marginTop:12,fontSize:13}}><EditField campo="descricao" label="Diagnostico" textarea/></div>
                <div style={{marginTop:14}}>
                  <span style={{display:'block',fontWeight:600,color:t.textSoft,fontSize:11,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Valor total</span>
                  <input type="number" value={form.valor||0} onChange={e=>up('valor',e.target.value)}
                    style={{width:'100%',padding:'13px 14px',borderRadius:13,border:'1px solid '+t.border,background:t.bgInput,color:t.text,
                            fontSize:19,fontWeight:700,fontFamily:'inherit',fontVariantNumeric:'tabular-nums'}}/>
                </div>
              </div>
            ) : (
              /* ---------- RECIBO ---------- */
              <div id="recibo-para-imprimir">
                <div className="rec">
                  <div className="rec-topo">
                    <div className="rec-check">
                      <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                    <div className="rec-status">{concluida ? 'Serviço concluído' : 'Recibo de serviço'}</div>
                    <div className="rec-valor">{fmt(form.valor)}</div>
                    <div className="rec-emp">{empresa.nome}</div>
                    <div className="rec-sub">
                      OS Nº {form.numero}
                      {empresa.cnpj ? <><br/>CNPJ {empresa.cnpj}</> : null}
                    </div>
                    {os.alterada && <div className="rec-selo">ALTERADA</div>}
                  </div>

                  <div className="rec-serrilha"/>

                  <div className="rec-corpo">
                    <Linha rotulo="Cliente"   valor={form.cliente_nome} forte/>
                    <Linha rotulo="Telefone"  valor={form.cliente_telefone}/>
                    <Linha rotulo="Endereço"  valor={form.cliente_endereco}/>
                    <Linha rotulo="Aparelho"  valor={form.produto} forte/>
                    <LinhaServicos texto={form.servico}/>
                    <Linha rotulo="Relato do cliente" valor={form.relato_cliente} formatado/>
                    <Linha rotulo="Diagnóstico"       valor={form.descricao} formatado/>
                  </div>

                  <div className="rec-rodape">
                    {os.usuarios?.nome && (
                      <div className="rec-rod-item"><b>Técnico</b><span>{os.usuarios.nome}</span></div>
                    )}
                    {form.data_entrada && (
                      <div className="rec-rod-item"><b>Atendimento</b><span>{fmtDate(form.data_entrada)}</span></div>
                    )}
                    {dataFim && (
                      <div className="rec-rod-item"><b>Concluído em</b><span>{fmtDate(dataFim)}</span></div>
                    )}
                  </div>
                  {garantiaDias > 0 && (
                    <div className="rec-garantia">
                      <div className="rec-gar-selo">
                        <svg viewBox="0 0 24 24"><path d="M12 2l8 3.5v6c0 5-3.4 9.2-8 10.5-4.6-1.3-8-5.5-8-10.5v-6L12 2z"/><path d="M8.7 12.2l2.3 2.3 4.5-4.6"/></svg>
                        <div>
                          <b>GARANTIA DE {garantiaRotulo.toUpperCase()}</b>
                          {validadeGarantia(dataFim, garantiaDias) && (
                            <span>Válida até {validadeGarantia(dataFim, garantiaDias)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="rec-obrigado">
                    {empresa.cidade && <div className="rec-end">{empresa.cidade}</div>}
                    {empresa.telefone && <div>{empresa.telefone}</div>}
                    {empresa.email && <div>{empresa.email}</div>}
                    <div className="rec-thanks">Obrigado pela preferência!</div>
                  </div>
                </div>
              </div>
            )}
            {os.historico_alteracoes&&(
              <div style={{maxWidth:420,margin:'14px auto 0',fontSize:11,color:t.textSoft,padding:'10px 13px',background:t.bgSidebar,borderRadius:12,borderLeft:'3px solid #E2900A'}}>
                <strong>Histórico de alterações:</strong>
                <pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit',margin:'4px 0 0',color:t.textSoft}}>{os.historico_alteracoes}</pre>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

function OSSelector({onSelect,t,s}) {
  const [lista,setLista]=useState([])
  const [busca,setBusca]=useState('')
  useEffect(()=>{supabase.from('ordens_servico').select('*, usuarios(nome)').order('criado_em',{ascending:false}).then(({data})=>setLista(data||[]))},[])
  const filtradas=lista.filter(o=>(o.cliente_nome||'').toLowerCase().includes(busca.toLowerCase())||(o.cliente_telefone||'').includes(busca)||String(o.numero).includes(busca))
  const fmt=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  return <div>
    <input style={s.search} placeholder="Buscar por nome, telefone ou numero OS..." value={busca} onChange={e=>setBusca(e.target.value)}/>
    <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:360,overflow:'auto'}}>
      {filtradas.map(o=>(
        <div key={o.id} onClick={()=>onSelect(o)} style={s.osItem}>
          <div><div style={{fontWeight:500,color:t.text}}>#{o.numero} - {o.cliente_nome||'Sem nome'}{o.alterada?' (alterada)':''}</div><div style={{fontSize:11,color:t.textSoft,marginTop:2}}>{o.servico||'Sem servico'} - {o.cliente_telefone||'-'}</div></div>
          <div style={{fontWeight:600,color:t.accent}}>{fmt(o.valor)}</div>
        </div>
      ))}
      {filtradas.length===0&&<div style={{fontSize:13,color:t.textSoft,textAlign:'center',padding:16}}>Nenhuma OS encontrada.</div>}
    </div>
  </div>
}
