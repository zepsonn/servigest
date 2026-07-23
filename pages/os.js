import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { useRouter } from 'next/router'

function useIsMobile(){ const [m,setM]=useState(false); useEffect(()=>{const c=()=>setM(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);return m }

const STATUS_COLORS = {em_andamento:['#FAEEDA','#854F0B'],concluida:['#EAF3DE','#3B6D11']}
function Badge({s}){ const [bg,c]=STATUS_COLORS[s]||['#F1EFE8','#5F5E5A']; return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:bg,color:c}}>{(s||'').replace('_',' ')}</span>}

const BAIRROS_CURITIBA = [
  'Abranches','Água Verde','Ahú','Alto Boqueirão','Alto da Glória','Alto da Rua XV',
  'Atuba','Augusta','Bacacheri','Bacacheri (Vila)','Bairro Alto','Barreirinha','Bigorrilho','Boa Vista','Bom Retiro',
  'Boqueirão','Butiatuvinha','Cabral','Cachoeira','Cajuru','Campina do Siqueira','Campo Comprido','Campo de Santana',
  'Capão da Imbuia','Capão Raso','Cascatinha','Caximba','Centro','Centro Cívico',
  'Cidade Industrial (CIC)','Cristo Rei','Fanny','Fazendinha','Ganchinho','Guaíra','Guabirotuba','Hauer',
  'Hugo Lange','Jardim Botânico','Jardim das Américas','Jardim Social','Juvevê',
  'Lamenha Pequena','Lindóia','Mercês','Mossunguê','Novo Mundo',
  'Orleans','Parolin','Pilarzinho','Pinheirinho','Portão','Prado Velho','Riviera',
  'Rebouças','Santa Cândida','Santa Felicidade','Santa Quitéria','Santo Inácio',
  'São Braz','São Francisco','São João','São Lourenço','São Miguel','Seminário',
  'Sítio Cercado','Taboão','Tarumã','Tatuquara','Tingui','Uberaba','Umbará',
  'Bairro Novo','Batel','Osternack','Vila Izabel','Vila Leão','Vista Alegre','Xaxim',
  'Sao Jose dos Pinhais',
  'Pinhais',
  'Piraquara',
  'Colombo',
  'Araucária',
  'Fazenda Rio Grande',
  'Campo Largo',
  'Almirante Tamandaré'
].sort()

const FORM0 = {
  cliente_id:'', cliente_nome:'', cliente_telefone:'', cliente_endereco:'',
  bairro:'', produto:'', servico:'', relato_cliente:'', descricao:'', valor:0,
  status:'em_andamento', periodo:'', data_entrada:new Date().toISOString().split('T')[0],
  data_conclusao:'', tecnico_id:'', observacoes:''
}

// componentes fora (corrige bug de foco)
function Modal({title,onClose,children,t,isMobile}){
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:isMobile?'flex-end':'center',justifyContent:'center'}}>
    <div style={{background:t.bgCard,borderRadius:isMobile?'16px 16px 0 0':12,padding:20,width:isMobile?'100%':600,maxWidth:'100vw',maxHeight:'94vh',overflow:'auto',border:'1px solid '+t.border}}>
      <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}>
        <span>{title}</span>
        <button style={{background:'none',border:'none',fontSize:24,cursor:'pointer',color:t.textSoft}} onClick={onClose}>×</button>
      </div>
      {children}
    </div>
  </div>
}

function FG({label,value,onChange,t,type,textarea,placeholder}){
  const st={width:'100%',padding:'9px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:14,fontFamily:'inherit',background:t.bgInput,color:t.text,minHeight:textarea?70:undefined,resize:textarea?'vertical':undefined}
  return <div style={{marginBottom:12}}>
    <label style={{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}}>{label}</label>
    {textarea?<textarea style={st} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>:<input type={type||'text'} style={st} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>}
  </div>
}

function FormOS({f,setF,t,agendamentos,tecnicos}){
  const inp={width:'100%',padding:'9px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:14,fontFamily:'inherit',background:t.bgInput,color:t.text}
  const lbl={display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}
  const sec={fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:t.textSoft,margin:'14px 0 8px',paddingBottom:6,borderBottom:'1px solid '+t.borderSoft}
  const periodoBtn=(p)=>({flex:1,padding:'10px 8px',borderRadius:8,border:'1px solid '+(f.periodo===p?t.accent:t.border),background:f.periodo===p?t.accentSoft:t.bgInput,color:f.periodo===p?t.accentDark:t.text,fontSize:13,cursor:'pointer',fontWeight:f.periodo===p?600:400,textAlign:'center'})

  return <>
    <div style={sec}>CLIENTE</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
      <FG label="Nome do cliente *" value={f.cliente_nome||''} onChange={v=>setF({...f,cliente_nome:v})} t={t}/>
      <FG label="Telefone" value={f.cliente_telefone||''} onChange={v=>setF({...f,cliente_telefone:v})} t={t}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10}}>
      <FG label="Endereço" value={f.cliente_endereco||''} onChange={v=>setF({...f,cliente_endereco:v})} t={t}/>
      <div style={{marginBottom:12}}>
        <label style={lbl}>Bairro</label>
        <select style={inp} value={f.bairro||''} onChange={e=>setF({...f,bairro:e.target.value})}>
          <option value="">Selecione...</option>
          {BAIRROS_CURITIBA.map(b=><option key={b} value={b}>{b}</option>)}
        </select>
      </div>
    </div>

    <div style={sec}>SERVIÇO</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
      <FG label="Produto/Equipamento" value={f.produto||''} onChange={v=>setF({...f,produto:v})} t={t} placeholder="Ex: Geladeira Brastemp"/>
      <FG label="Serviço" value={f.servico||''} onChange={v=>setF({...f,servico:v})} t={t} placeholder="Ex: Manutenção"/>
    </div>
    <FG label="Relato do cliente (o que ele falou)" value={f.relato_cliente||''} onChange={v=>setF({...f,relato_cliente:v})} t={t} textarea placeholder="Ex: Cliente disse que a geladeira não está gelando e faz barulho"/>
    <FG label="Diagnóstico / Descrição" value={f.descricao||''} onChange={v=>setF({...f,descricao:v})} t={t} textarea/>

    <div style={sec}>AGENDAMENTO</div>
    <FG label="Data *" value={f.data_entrada||''} onChange={v=>setF({...f,data_entrada:v})} t={t} type="date"/>
    <div style={{marginBottom:12}}>
      <label style={lbl}>Período</label>
      <div style={{display:'flex',gap:8}}>
        {['manha','tarde','noite'].map(p=>(
          <div key={p} style={periodoBtn(p)} onClick={()=>setF({...f,periodo:p})}>
            {p==='manha'?'Manhã':p==='tarde'?'Tarde':'Noite'}
          </div>
        ))}
      </div>
    </div>

    <div style={sec}>DETALHES</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
      <FG label="Valor (R$)" value={f.valor||0} onChange={v=>setF({...f,valor:v})} t={t} type="number"/>
      <div style={{marginBottom:12}}>
        <label style={lbl}>Status</label>
        <select style={inp} value={f.status||'em_andamento'} onChange={e=>setF({...f,status:e.target.value})}>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
        </select>
      </div>
    </div>
    <div style={{marginBottom:12}}>
      <label style={lbl}>Técnico responsável</label>
      <select style={inp} value={f.tecnico_id||''} onChange={e=>setF({...f,tecnico_id:e.target.value})}>
        <option value="">Selecione...</option>
        {tecnicos.map(tc=><option key={tc.id} value={tc.id}>{tc.nome}</option>)}
      </select>
    </div>
    <FG label="Observações" value={f.observacoes||''} onChange={v=>setF({...f,observacoes:v})} t={t} textarea/>
  </>
}

export default function OS() {
  const [lista, setLista] = useState([])
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [detalhe, setDetalhe] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [tecnicos, setTecnicos] = useState([])
  const [user, setUser] = useState(null)
  const [form, setForm] = useState(FORM0)
  const [editForm, setEditForm] = useState({})
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const router = useRouter()

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('servigest_user')||'{}')
    setUser(u); loadOS()
    supabase.from('usuarios').select('id,nome').eq('ativo',true).order('nome').then(({data})=>setTecnicos(data||[]))
  },[])

  async function loadOS(){
    const{data}=await supabase.from('ordens_servico').select('*, usuarios(nome,comissao_percentual)').order('cliente_nome')
    setLista(data||[])
  }

  async function salvar(){
    if(!form.cliente_nome||!form.data_entrada){alert('Preencha o nome do cliente e a data');return}
    const{agendamento_id,...formData}=form
    await supabase.from('ordens_servico').insert([{...formData,valor:Number(form.valor)||0,cliente_id:form.cliente_id||null,tecnico_id:form.tecnico_id||null,data_conclusao:form.data_conclusao||null,bairro:form.bairro||null,periodo:form.periodo||null}])
    setModal(false); setForm(FORM0); loadOS()
  }

  async function salvarEdicao(){
    await supabase.from('ordens_servico').update({
      cliente_nome:editForm.cliente_nome, cliente_telefone:editForm.cliente_telefone,
      cliente_endereco:editForm.cliente_endereco, bairro:editForm.bairro,
      produto:editForm.produto, servico:editForm.servico,
      relato_cliente:editForm.relato_cliente, descricao:editForm.descricao,
      valor:Number(editForm.valor)||0, status:editForm.status, periodo:editForm.periodo,
      data_entrada:editForm.data_entrada, data_conclusao:editForm.data_conclusao||null,
      tecnico_id:editForm.tecnico_id||null, observacoes:editForm.observacoes,
    }).eq('id',editModal.id)
    setEditModal(null); loadOS()
  }

  async function apagar(os){
    if(!confirm('Apagar OS #'+os.numero+'?'))return
    await supabase.from('ordens_servico').delete().eq('id',os.id); loadOS()
  }

  function fmtDataBR(d){
    if(!d) return '-'
    return new Date(d+'T12:00').toLocaleDateString('pt-BR')
  }

  const PERIODO_LABEL={manha:'Manhã',tarde:'Tarde',noite:'Noite'}

  async function copiarParaWhatsapp(o){
    const linhas=[
      `*OS Nº ${o.numero}*`,
      `Cliente: ${o.cliente_nome||'-'}`,
      o.cliente_telefone?`Telefone: ${o.cliente_telefone}`:null,
      `Endereço: ${o.cliente_endereco||'-'}${o.bairro?' - '+o.bairro:''}`,
      `Data: ${fmtDataBR(o.data_entrada)}${o.periodo?' ('+(PERIODO_LABEL[o.periodo]||o.periodo)+')':''}`,
      o.produto?`Produto: ${o.produto}`:null,
      o.servico?`Serviço: ${o.servico}`:null,
      o.relato_cliente?`Relato do cliente: ${o.relato_cliente}`:null,
      `Diagnóstico: ${o.descricao||'-'}`,
    ].filter(Boolean)
    const texto=linhas.join('\n')
    try{
      await navigator.clipboard.writeText(texto)
      alert('OS copiada! Agora é só colar no WhatsApp.')
    }catch(e){
      // fallback pra navegadores sem permissao de clipboard
      const ta=document.createElement('textarea')
      ta.value=texto; document.body.appendChild(ta); ta.select()
      document.execCommand('copy'); document.body.removeChild(ta)
      alert('OS copiada! Agora é só colar no WhatsApp.')
    }
  }

  async function concluir(id){
    await supabase.from('ordens_servico').update({status:'concluida',data_conclusao:new Date().toISOString().split('T')[0]}).eq('id',id); loadOS()
  }

  const filtradas = lista.filter(o=>
    (o.cliente_nome||'').toLowerCase().includes(busca.toLowerCase())||
    (o.cliente_telefone||'').includes(busca)||
    String(o.numero).includes(busca)||
    (o.servico||'').toLowerCase().includes(busca.toLowerCase())||
    (o.produto||'').toLowerCase().includes(busca.toLowerCase())||
    (o.bairro||'').toLowerCase().includes(busca.toLowerCase())
  )

  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const isGestor = user?.role==='gestor'
  const periodoLabel = {manha:'Manhã',tarde:'Tarde',noite:'Noite'}

  return (
    <Layout title="Ordens de Serviço">
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        <input style={{flex:1,padding:'9px 14px',borderRadius:8,border:'1px solid '+t.border,background:t.bgInput,fontSize:13,fontFamily:'inherit',color:t.text}} placeholder="Buscar por nome, bairro, produto..." value={busca} onChange={e=>setBusca(e.target.value)}/>
        <button style={{padding:'9px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500,whiteSpace:'nowrap'}} onClick={()=>setModal(true)}>+ Nova OS</button>
      </div>

      {/* CARDS DE STATUS */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
        {[['Em andamento','em_andamento','#854F0B'],['Concluídas','concluida','#3B6D11']].map(([label,st,color])=>(
          <div key={st} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'12px 14px',boxShadow:t.shadow}}>
            <div style={{fontSize:10,color:t.textSoft,marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>{label}</div>
            <div style={{fontSize:24,fontWeight:700,color,fontVariantNumeric:'tabular-nums'}}>{lista.filter(o=>o.status===st).length}</div>
          </div>
        ))}
      </div>

      {/* LISTA DE OS — visual limpo */}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {filtradas.map(o=>(
          <div key={o.id} style={{background:t.bgCard,border:'1px solid '+(o.status==='concluida'?'#3B6D11':t.border),borderRadius:12,overflow:'hidden',boxShadow:t.shadow}}>
            {/* LINHA PRINCIPAL — sempre visível */}
            <div style={{display:'flex',alignItems:'center',gap:0,cursor:'pointer'}} onClick={()=>setDetalhe(detalhe?.id===o.id?null:o)}>
              {/* cor status lateral */}
              <div style={{width:4,alignSelf:'stretch',background:o.status==='concluida'?'#3B6D11':'#854F0B',flexShrink:0,borderRadius:'12px 0 0 12px'}}/>
              <div style={{flex:1,padding:'12px 14px',display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'2fr 2fr 1fr 1fr 1fr',gap:8,alignItems:'center'}}>
                {/* cliente */}
                <div>
                  <div style={{fontWeight:600,color:t.text,fontSize:14}}>{o.cliente_nome||'—'}</div>
                  <div style={{fontSize:11,color:t.textSoft,marginTop:1}}>{o.cliente_telefone||''}</div>
                </div>
                {/* produto */}
                <div>
                  <div style={{fontSize:13,color:t.text}}>{o.produto||'—'}</div>
                  <div style={{fontSize:11,color:t.textSoft}}>{o.servico||''}</div>
                </div>
                {/* bairro */}
                <div style={{fontSize:12,color:t.textSoft}}>{o.bairro||'—'}</div>
                {/* tecnico */}
                <div style={{fontSize:12,color:t.text}}>{o.usuarios?.nome||'—'}</div>
                {/* status + periodo */}
                <div style={{display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end'}}>
                  <Badge s={o.status}/>
                  {o.periodo&&<span style={{fontSize:10,color:t.textSoft}}>{periodoLabel[o.periodo]||o.periodo}</span>}
                </div>
              </div>
            </div>

            {/* DETALHE EXPANDIDO */}
            {detalhe?.id===o.id&&(
              <div style={{borderTop:'1px solid '+t.borderSoft,padding:'12px 14px 14px 18px',background:t.bgSidebar}}>
                <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr',gap:12,fontSize:13,marginBottom:12}}>
                  <div><span style={{fontSize:11,color:t.textSoft,display:'block'}}>Endereço</span><span style={{color:t.text}}>{o.cliente_endereco||'—'}</span></div>
                  <div><span style={{fontSize:11,color:t.textSoft,display:'block'}}>Data entrada</span><span style={{color:t.text}}>{o.data_entrada?new Date(o.data_entrada+'T12:00').toLocaleDateString('pt-BR'):'—'}</span></div>
                  <div><span style={{fontSize:11,color:t.textSoft,display:'block'}}>Valor</span><span style={{color:t.accent,fontWeight:700,fontSize:16}}>{fmt(o.valor)}</span></div>
                  {o.relato_cliente&&<div style={{gridColumn:isMobile?'1':'1/-1'}}><span style={{fontSize:11,color:t.textSoft,display:'block'}}>Relato do cliente</span><span style={{color:t.text}}>{o.relato_cliente}</span></div>}
                  {o.descricao&&<div style={{gridColumn:isMobile?'1':'1/-1'}}><span style={{fontSize:11,color:t.textSoft,display:'block'}}>Diagnóstico</span><span style={{color:t.text}}>{o.descricao}</span></div>}
                  {o.observacoes&&<div style={{gridColumn:isMobile?'1':'1/-1'}}><span style={{fontSize:11,color:t.textSoft,display:'block'}}>Observações</span><span style={{color:t.text}}>{o.observacoes}</span></div>}
                </div>

                {/* DETALHAMENTO FINANCEIRO — só quando concluída */}
                {o.status==='concluida'&&(()=>{
                  const pct=o.usuarios?.comissao_percentual||0
                  const ehTaxa=o.eh_taxa
                  const valorTotal=Number(o.valor||0)
                  const pecas=Number(o.valor_pecas||0)
                  const maoObra=Number(o.valor_mao_obra!=null?o.valor_mao_obra:Math.max(valorTotal-pecas,0))
                  let paraTecnico=0, paraEmpresa=valorTotal
                  if(ehTaxa){
                    // taxa: mao_obra guarda quanto foi pro tecnico (0 se 1a do dia ou Claudio)
                    paraTecnico = pct>0 ? Number(o.valor_mao_obra||0)/2 : 0
                    paraEmpresa = valorTotal - paraTecnico
                  } else if(pct>0){
                    paraTecnico = maoObra*pct/100
                    paraEmpresa = valorTotal - paraTecnico
                  }
                  return (
                    <div style={{background:t.bgCard,border:'1px solid '+t.borderSoft,borderRadius:8,padding:'12px 14px',marginBottom:12}}>
                      <div style={{fontSize:11,fontWeight:700,color:t.textSoft,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>
                        {ehTaxa?'💰 Detalhamento — Taxa de visita':'💰 Detalhamento financeiro'}
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:5,fontSize:13}}>
                        <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:t.textSoft}}>{ehTaxa?'Valor da taxa':'Valor total cobrado'}</span><strong style={{color:t.text}}>{fmt(valorTotal)}</strong></div>
                        {!ehTaxa&&pecas>0&&<div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:t.textSoft}}>Valor de peças</span><span style={{color:t.text}}>− {fmt(pecas)}</span></div>}
                        {!ehTaxa&&<div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:t.textSoft}}>Mão de obra</span><strong style={{color:t.text}}>{fmt(maoObra)}</strong></div>}
                        <div style={{borderTop:'1px solid '+t.borderSoft,margin:'4px 0',paddingTop:5}}/>
                        {paraTecnico>0&&<div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:t.textSoft}}>Para {o.usuarios?.nome||'técnico'}</span><strong style={{color:t.accent}}>{fmt(paraTecnico)}</strong></div>}
                        <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:t.textSoft}}>Para empresa</span><strong style={{color:t.text}}>{fmt(paraEmpresa)}</strong></div>
                      </div>
                    </div>
                  )
                })()}
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {o.status!=='concluida'&&<button style={{padding:'7px 14px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:500}} onClick={()=>concluir(o.id)}>✓ Concluir</button>}
                  <button style={{padding:'7px 14px',borderRadius:8,border:'1px solid '+t.border,background:t.bgCard,color:t.text,fontSize:12,cursor:'pointer'}} onClick={()=>{setEditForm({...o,tecnico_id:o.tecnico_id||''});setEditModal(o);setDetalhe(null)}}>✏️ Editar</button>
                  <button style={{padding:'7px 14px',borderRadius:8,border:'1px solid '+t.border,background:t.bgCard,color:t.text,fontSize:12,cursor:'pointer'}} onClick={()=>router.push('/recibo?os='+o.id)}>🧾 Recibo</button>
                  <button style={{padding:'7px 14px',borderRadius:8,border:'1px solid #DCF0E5',background:t.bgCard,color:'#1D9E75',fontSize:12,cursor:'pointer'}} onClick={()=>copiarParaWhatsapp(o)}>📋 Copiar p/ WhatsApp</button>
                  {isGestor&&<button style={{padding:'7px 14px',borderRadius:8,border:'1px solid #FCEBEB',background:t.bgCard,color:'#A32D2D',fontSize:12,cursor:'pointer'}} onClick={()=>apagar(o)}>🗑️ Apagar</button>}
                </div>
              </div>
            )}
          </div>
        ))}
        {filtradas.length===0&&<div style={{padding:32,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhuma OS encontrada.</div>}
      </div>

      {/* MODAL NOVA OS */}
      {modal&&<Modal title="Nova OS" onClose={()=>{setModal(false);setForm(FORM0)}} t={t} isMobile={isMobile}>
        <FormOS f={form} setF={setForm} t={t} agendamentos={[]} tecnicos={tecnicos}/>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
          <button style={{padding:'10px 16px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:14,cursor:'pointer'}} onClick={()=>{setModal(false);setForm(FORM0)}}>Cancelar</button>
          <button style={{padding:'10px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:14,cursor:'pointer',fontWeight:500}} onClick={salvar}>Salvar OS</button>
        </div>
      </Modal>}

      {/* MODAL EDITAR OS */}
      {editModal&&<Modal title={'Editar OS #'+editModal.numero} onClose={()=>setEditModal(null)} t={t} isMobile={isMobile}>
        <FormOS f={editForm} setF={setEditForm} t={t} agendamentos={[]} tecnicos={tecnicos}/>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
          <button style={{padding:'10px 16px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:14,cursor:'pointer'}} onClick={()=>setEditModal(null)}>Cancelar</button>
          <button style={{padding:'10px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:14,cursor:'pointer',fontWeight:500}} onClick={salvarEdicao}>Salvar alterações</button>
        </div>
      </Modal>}
    </Layout>
  )
}
