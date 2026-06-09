import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import { useRouter } from 'next/router'

function FG({label,value,onChange,t,textarea,type,placeholder}){
  const st={width:'100%',padding:'9px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:14,fontFamily:'inherit',background:t.bgInput,color:t.text,minHeight:textarea?70:undefined,resize:textarea?'vertical':undefined}
  return <div style={{marginBottom:14}}><label style={{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}}>{label}</label>{textarea?<textarea style={st} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>:<input style={st} type={type||'text'} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>}</div>
}

export default function NovoAgendamento() {
  const [clientes, setClientes] = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [cliModal, setCliModal] = useState(false)
  const [cliForm, setCliForm] = useState({nome:'',telefone:'',whatsapp:'',email:'',cpf_cnpj:'',endereco:''})
  const [form, setForm] = useState({
    cliente_id:'', cliente_nome:'', cliente_telefone:'', cliente_endereco:'',
    funcionario_id:'', servico:'', data:'', periodo:'', status:'em_andamento', valor:0, observacoes:''
  })
  const [erro, setErro] = useState('')
  const { t } = useTheme()
  const router = useRouter()

  useEffect(()=>{
    loadClientes()
    supabase.from('usuarios').select('id,nome').eq('ativo',true).order('nome').then(({data})=>setFuncionarios(data||[]))
  },[])

  async function loadClientes(){
    const { data } = await supabase.from('clientes').select('id,nome,telefone,endereco').eq('ativo',true).order('nome')
    setClientes(data||[])
  }

  function selecionarCliente(id) {
    const c = clientes.find(x=>x.id===id)
    if(c) setForm(prev=>({...prev, cliente_id:c.id, cliente_nome:c.nome, cliente_telefone:c.telefone||'', cliente_endereco:c.endereco||''}))
    else setForm(prev=>({...prev, cliente_id:''}))
  }

  async function salvarCliente() {
    if (!cliForm.nome) { alert('Digite o nome'); return }
    const { data, error } = await supabase.from('clientes').insert([cliForm]).select().single()
    if (error) { alert('Erro ao cadastrar'); return }
    await loadClientes()
    setForm(prev=>({...prev, cliente_id:data.id, cliente_nome:data.nome, cliente_telefone:data.telefone||'', cliente_endereco:data.endereco||''}))
    setCliForm({nome:'',telefone:'',whatsapp:'',email:'',cpf_cnpj:'',endereco:''})
    setCliModal(false)
  }

  async function salvar() {
    if (!form.cliente_nome || !form.servico || !form.data || !form.periodo) {
      setErro('Preencha nome do cliente, serviço, data e período.'); return
    }
    const { error: e1 } = await supabase.from('agendamentos').insert([{
      cliente_id: form.cliente_id || null, cliente_nome: form.cliente_nome,
      cliente_telefone: form.cliente_telefone, cliente_endereco: form.cliente_endereco,
      funcionario_id: form.funcionario_id || null, servico: form.servico,
      data: form.data, periodo: form.periodo, status: form.status,
      valor: Number(form.valor) || 0, observacoes: form.observacoes,
    }])
    if (e1) { setErro('Erro ao salvar: ' + e1.message); return }
    await supabase.from('ordens_servico').insert([{
      cliente_id: form.cliente_id || null, cliente_nome: form.cliente_nome,
      cliente_telefone: form.cliente_telefone, cliente_endereco: form.cliente_endereco,
      servico: form.servico, valor: Number(form.valor) || 0,
      status: form.status, data_entrada: form.data,
      tecnico_id: form.funcionario_id || null, observacoes: form.observacoes,
    }])
    router.push('/agendamentos')
  }

  const servicos = ['Limpeza residencial','Limpeza comercial','Manutenção','Instalação','Reparo elétrico','Conserto','Diagnóstico','Outro']

  const s = {
    box:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:24,maxWidth:560},
    h2:{fontSize:16,fontWeight:600,marginBottom:20,color:t.text},
    err:{fontSize:12,color:'#a32d2d',background:'#fcebeb',padding:'8px 12px',borderRadius:8,marginBottom:16},
    label:{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3},
    input:{width:'100%',padding:'9px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:14,fontFamily:'inherit',background:t.bgInput,color:t.text},
    row2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12},
    sec:{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:t.textSoft,margin:'16px 0 8px',paddingBottom:6,borderBottom:'1px solid '+t.borderSoft},
    btnRow:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:20},
    btnPrimary:{padding:'10px 20px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:14,cursor:'pointer',fontWeight:500},
    btnSecondary:{padding:'10px 20px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:14,cursor:'pointer'},
    periodoBtn:(active)=>({flex:1,padding:'12px 8px',borderRadius:8,border:'1px solid '+(active?t.accent:t.border),background:active?t.accentSoft:t.bgInput,color:active?t.accentDark:t.text,fontSize:13,cursor:'pointer',fontWeight:active?600:400,textAlign:'center'}),
  }

  return (
    <Layout title="Novo Agendamento">
      <div style={s.box}>
        <h2 style={s.h2}>Novo agendamento</h2>
        {erro && <div style={s.err}>{erro}</div>}

        <div style={s.sec}>CLIENTE</div>
        <div style={{marginBottom:14}}>
          <label style={s.label}>Cliente cadastrado</label>
          <div style={{display:'flex',gap:8}}>
            <select style={{...s.input,flex:1}} value={form.cliente_id} onChange={e=>selecionarCliente(e.target.value)}>
              <option value="">— Selecione ou digite abaixo —</option>
              {clientes.map(c=><option key={c.id} value={c.id}>{c.nome} · {c.telefone}</option>)}
            </select>
            <button type="button" style={{padding:'0 14px',borderRadius:8,border:'1px solid '+t.accent,background:t.accentSoft,color:t.accentDark,fontSize:12,cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}} onClick={()=>setCliModal(true)}>+ Novo</button>
          </div>
        </div>
        <div style={s.row2}>
          <FG label="Nome do cliente *" value={form.cliente_nome} onChange={v=>setForm({...form,cliente_nome:v})} t={t}/>
          <FG label="Telefone" value={form.cliente_telefone} onChange={v=>setForm({...form,cliente_telefone:v})} t={t}/>
        </div>
        <FG label="Endereço" value={form.cliente_endereco} onChange={v=>setForm({...form,cliente_endereco:v})} t={t}/>

        <div style={s.sec}>SERVIÇO</div>
        <div style={{marginBottom:14}}><label style={s.label}>Tipo de serviço *</label>
          <select style={s.input} value={form.servico} onChange={e=>setForm({...form,servico:e.target.value})}>
            <option value="">Selecione...</option>{servicos.map(sv=><option key={sv}>{sv}</option>)}
          </select>
        </div>
        <FG label="Data *" value={form.data} onChange={v=>setForm({...form,data:v})} t={t} type="date"/>

        <div style={{marginBottom:14}}>
          <label style={s.label}>Período *</label>
          <div style={{display:'flex',gap:8}}>
            <div style={s.periodoBtn(form.periodo==='manha')} onClick={()=>setForm({...form,periodo:'manha'})}>Manhã</div>
            <div style={s.periodoBtn(form.periodo==='tarde')} onClick={()=>setForm({...form,periodo:'tarde'})}>Tarde</div>
            <div style={s.periodoBtn(form.periodo==='noite')} onClick={()=>setForm({...form,periodo:'noite'})}>Noite</div>
          </div>
        </div>

        <div style={s.row2}>
          <FG label="Valor (R$)" value={form.valor} onChange={v=>setForm({...form,valor:v})} t={t} type="number"/>
          <div style={{marginBottom:14}}><label style={s.label}>Status</label>
            <select style={s.input} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              <option value="em_andamento">Em andamento</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>
        </div>
        <div style={{marginBottom:14}}><label style={s.label}>Técnico responsável</label>
          <select style={s.input} value={form.funcionario_id} onChange={e=>setForm({...form,funcionario_id:e.target.value})}>
            <option value="">Selecione...</option>{funcionarios.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
        <FG label="Observações" value={form.observacoes} onChange={v=>setForm({...form,observacoes:v})} t={t} textarea/>

        <div style={{fontSize:11,color:t.textSoft,marginTop:4}}>Ao salvar, também cria uma Ordem de Serviço automaticamente.</div>

        <div style={s.btnRow}>
          <button style={s.btnSecondary} onClick={()=>router.push('/agendamentos')}>Cancelar</button>
          <button style={s.btnPrimary} onClick={salvar}>Salvar</button>
        </div>
      </div>

      {cliModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:t.bgCard,borderRadius:12,padding:24,width:440,maxWidth:'96vw',border:'1px solid '+t.border}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',justifyContent:'space-between',color:t.text}}><span>Cadastrar cliente</span><button style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:t.textSoft}} onClick={()=>setCliModal(false)}>×</button></div>
            {[['nome','Nome completo *'],['telefone','Telefone'],['whatsapp','WhatsApp'],['email','E-mail'],['cpf_cnpj','CPF / CNPJ'],['endereco','Endereço']].map(([k,l])=>(
              <FG key={k} label={l} value={cliForm[k]} onChange={v=>setCliForm({...cliForm,[k]:v})} t={t}/>
            ))}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
              <button style={s.btnSecondary} onClick={()=>setCliModal(false)}>Cancelar</button>
              <button style={s.btnPrimary} onClick={salvarCliente}>Cadastrar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
