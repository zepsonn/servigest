import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { useRouter } from 'next/router'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState(null)
  const [osCliente, setOsCliente] = useState([])
  const [novaOsModal, setNovaOsModal] = useState(false)
  const [tecnicos, setTecnicos] = useState([])
  const [form, setForm] = useState({produto:'',servico:'',descricao:'',valor:0,periodo:'',data_entrada:new Date().toISOString().split('T')[0],tecnico_id:'',observacoes:''})
  const { t } = useTheme()
  const router = useRouter()

  useEffect(()=>{
    load()
    supabase.from('usuarios').select('id,nome').eq('ativo',true).order('nome').then(({data})=>setTecnicos(data||[]))
  },[])

  async function load() {
    // agrupa OS por cliente (nome+telefone)
    const { data: os } = await supabase.from('ordens_servico')
      .select('id,numero,cliente_nome,cliente_telefone,cliente_endereco,bairro,produto,servico,valor,status,data_entrada,data_conclusao,periodo,usuarios(nome)')
      .order('criado_em',{ascending:false})

    if (!os) return

    // agrupa por cliente_nome+telefone
    const mapa = {}
    os.forEach(o => {
      const key = (o.cliente_nome||'').toLowerCase().trim() + '|' + (o.cliente_telefone||'').replace(/\D/g,'')
      if (!mapa[key]) {
        mapa[key] = {
          nome: o.cliente_nome||'Sem nome',
          telefone: o.cliente_telefone||'',
          endereco: o.cliente_endereco||'',
          bairro: o.bairro||'',
          total_os: 0,
          ultima_os: o.data_entrada,
          os: []
        }
      }
      mapa[key].total_os++
      mapa[key].os.push(o)
    })

    const lista = Object.values(mapa).sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR'))
    setClientes(lista)
  }

  function abrirCliente(cli) {
    setSelecionado(cli)
    setOsCliente(cli.os)
  }

  async function adicionarOS() {
    if (!form.data_entrada) { alert('Preencha a data'); return }
    await supabase.from('ordens_servico').insert([{
      cliente_nome: selecionado.nome,
      cliente_telefone: selecionado.telefone,
      cliente_endereco: selecionado.endereco,
      bairro: selecionado.bairro,
      produto: form.produto,
      servico: form.servico,
      descricao: form.descricao,
      valor: Number(form.valor)||0,
      status: 'em_andamento',
      periodo: form.periodo||null,
      data_entrada: form.data_entrada,
      tecnico_id: form.tecnico_id||null,
      observacoes: form.observacoes,
    }])
    setNovaOsModal(false)
    setForm({produto:'',servico:'',descricao:'',valor:0,periodo:'',data_entrada:new Date().toISOString().split('T')[0],tecnico_id:'',observacoes:''})
    await load()
    // recarrega os do cliente
    const cli = clientes.find(c=>c.nome===selecionado.nome&&c.telefone===selecionado.telefone)
    if (cli) abrirCliente(cli)
  }

  const fmt = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
  const fmtDate = d => d ? new Date(d+'T12:00').toLocaleDateString('pt-BR') : '—'
  const periodoLabel = {manha:'Manhã',tarde:'Tarde',noite:'Noite'}
  const statusBg = {em_andamento:'#FAEEDA',concluida:'#EAF3DE'}
  const statusColor = {em_andamento:'#854F0B',concluida:'#3B6D11'}

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca) ||
    (c.bairro||'').toLowerCase().includes(busca.toLowerCase())
  )

  const inp = {width:'100%',padding:'9px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:14,fontFamily:'inherit',background:t.bgInput,color:t.text}
  const lbl = {display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}

  return (
    <Layout title="Clientes">
      {!selecionado ? (
        <>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            <input style={{flex:1,padding:'9px 14px',borderRadius:8,border:'1px solid '+t.border,background:t.bgInput,fontSize:13,fontFamily:'inherit',color:t.text}} placeholder="Buscar por nome, telefone ou bairro..." value={busca} onChange={e=>setBusca(e.target.value)}/>
          </div>
          <div style={{fontSize:12,color:t.textSoft,marginBottom:12}}>{filtrados.length} cliente{filtrados.length!==1?'s':''} encontrado{filtrados.length!==1?'s':''}</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {filtrados.map((c,i)=>(
              <div key={i} onClick={()=>abrirCliente(c)} style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
                {/* avatar inicial */}
                <div style={{width:40,height:40,borderRadius:'50%',background:t.accentSoft,color:t.accent,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:16,flexShrink:0}}>
                  {c.nome.charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,color:t.text,fontSize:14}}>{c.nome}</div>
                  <div style={{fontSize:12,color:t.textSoft,marginTop:1}}>{c.telefone}{c.bairro?' · '+c.bairro:''}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:c.total_os>=2?t.accent:t.textSoft}}>{c.total_os} OS</div>
                  {c.total_os>=2&&<div style={{fontSize:10,color:t.accent,fontWeight:500}}>Cliente fixo</div>}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textSoft} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
            {filtrados.length===0&&<div style={{padding:32,textAlign:'center',color:t.textSoft,fontSize:13}}>Nenhum cliente encontrado.</div>}
          </div>
        </>
      ) : (
        // DETALHE DO CLIENTE
        <>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
            <button onClick={()=>setSelecionado(null)} style={{background:'none',border:'none',cursor:'pointer',color:t.textSoft,fontSize:22,padding:0,display:'flex'}}>←</button>
            <div style={{flex:1}}>
              <div style={{fontSize:18,fontWeight:700,color:t.text}}>{selecionado.nome}</div>
              <div style={{fontSize:13,color:t.textSoft}}>{selecionado.telefone}{selecionado.bairro?' · '+selecionado.bairro:''}</div>
            </div>
            <button onClick={()=>setNovaOsModal(true)} style={{padding:'8px 16px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500}}>+ Nova OS</button>
          </div>

          {/* RESUMO */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
            <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'12px 14px'}}>
              <div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Total de OS</div>
              <div style={{fontSize:20,fontWeight:700,color:t.text}}>{osCliente.length}</div>
            </div>
            <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'12px 14px'}}>
              <div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Total gasto</div>
              <div style={{fontSize:20,fontWeight:700,color:t.accent}}>{fmt(osCliente.filter(o=>o.status==='concluida').reduce((s,o)=>s+Number(o.valor||0),0))}</div>
            </div>
            <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:10,padding:'12px 14px'}}>
              <div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>Em andamento</div>
              <div style={{fontSize:20,fontWeight:700,color:'#854F0B'}}>{osCliente.filter(o=>o.status==='em_andamento').length}</div>
            </div>
          </div>

          {/* HISTORICO DE OS */}
          <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:12}}>Histórico de serviços</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {osCliente.map(o=>(
              <div key={o.id} style={{background:t.bgCard,border:'1px solid '+(o.status==='concluida'?'#3B6D11':t.border),borderRadius:12,padding:'14px 16px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div>
                    <div style={{fontWeight:600,color:t.text,fontSize:14}}>OS #{o.numero}</div>
                    <div style={{fontSize:12,color:t.textSoft,marginTop:1}}>{o.produto||'—'} {o.servico?'· '+o.servico:''}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <span style={{display:'inline-block',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:statusBg[o.status]||'#f0f0f0',color:statusColor[o.status]||'#666'}}>{(o.status||'').replace('_',' ')}</span>
                    <div style={{fontSize:14,fontWeight:700,color:t.accent,marginTop:4}}>{fmt(o.valor)}</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12,color:t.textSoft}}>
                  <div>Data: {fmtDate(o.data_entrada)}</div>
                  <div>Técnico: {o.usuarios?.nome||'—'}</div>
                  {o.periodo&&<div>Período: {periodoLabel[o.periodo]||o.periodo}</div>}
                  {o.data_conclusao&&<div>Conclusão: {fmtDate(o.data_conclusao)}</div>}
                </div>
                {o.descricao&&<div style={{fontSize:12,color:t.textSoft,marginTop:6,paddingTop:6,borderTop:'1px solid '+t.borderSoft}}>Diagnóstico: {o.descricao}</div>}
                {o.observacoes&&<div style={{fontSize:12,color:t.textSoft,marginTop:4}}>Obs: {o.observacoes}</div>}
                <button onClick={()=>router.push('/recibo?os='+o.id)} style={{marginTop:10,padding:'6px 14px',borderRadius:8,border:'1px solid '+t.border,background:t.bgCard,color:t.text,fontSize:12,cursor:'pointer'}}>🧾 Ver recibo</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MODAL NOVA OS PARA CLIENTE EXISTENTE */}
      {novaOsModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:t.bgCard,borderRadius:'16px 16px 0 0',padding:24,width:'100%',maxWidth:560,maxHeight:'90vh',overflow:'auto',border:'1px solid '+t.border}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:4,display:'flex',justifyContent:'space-between',color:t.text}}>
              <span>Nova OS — {selecionado?.nome}</span>
              <button style={{background:'none',border:'none',fontSize:24,cursor:'pointer',color:t.textSoft}} onClick={()=>setNovaOsModal(false)}>×</button>
            </div>
            <div style={{fontSize:12,color:t.textSoft,marginBottom:16}}>{selecionado?.telefone} · {selecionado?.bairro}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div style={{marginBottom:12}}><label style={lbl}>Produto</label><input style={inp} value={form.produto} onChange={e=>setForm({...form,produto:e.target.value})} placeholder="Ex: Geladeira Brastemp"/></div>
              <div style={{marginBottom:12}}><label style={lbl}>Serviço</label><input style={inp} value={form.servico} onChange={e=>setForm({...form,servico:e.target.value})} placeholder="Ex: Manutenção"/></div>
            </div>
            <div style={{marginBottom:12}}><label style={lbl}>Diagnóstico</label><textarea style={{...inp,minHeight:60,resize:'vertical'}} value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})}/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div style={{marginBottom:12}}><label style={lbl}>Data *</label><input type="date" style={inp} value={form.data_entrada} onChange={e=>setForm({...form,data_entrada:e.target.value})}/></div>
              <div style={{marginBottom:12}}><label style={lbl}>Período</label>
                <select style={inp} value={form.periodo} onChange={e=>setForm({...form,periodo:e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div style={{marginBottom:12}}><label style={lbl}>Valor (R$)</label><input type="number" style={inp} value={form.valor} onChange={e=>setForm({...form,valor:e.target.value})}/></div>
              <div style={{marginBottom:12}}><label style={lbl}>Técnico</label>
                <select style={inp} value={form.tecnico_id} onChange={e=>setForm({...form,tecnico_id:e.target.value})}>
                  <option value="">Selecione...</option>
                  {tecnicos.map(tc=><option key={tc.id} value={tc.id}>{tc.nome}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:16}}><label style={lbl}>Observações</label><textarea style={{...inp,minHeight:50,resize:'vertical'}} value={form.observacoes} onChange={e=>setForm({...form,observacoes:e.target.value})}/></div>
            <div style={{display:'flex',gap:8}}>
              <button style={{flex:1,padding:'12px',borderRadius:8,background:'transparent',border:'1px solid '+t.border,color:t.textSoft,fontSize:14,cursor:'pointer'}} onClick={()=>setNovaOsModal(false)}>Cancelar</button>
              <button style={{flex:2,padding:'12px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:14,cursor:'pointer',fontWeight:600}} onClick={adicionarOS}>Salvar OS</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
