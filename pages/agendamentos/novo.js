import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import { useRouter } from 'next/router'

export default function NovoAgendamento() {
  const [clientes, setClientes] = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [form, setForm] = useState({
    cliente_id:'', cliente_nome:'', cliente_telefone:'', cliente_endereco:'',
    funcionario_id:'', servico:'', data:'', hora:'', status:'agendado', valor:0, observacoes:''
  })
  const [erro, setErro] = useState('')
  const { t } = useTheme()
  const router = useRouter()

  useEffect(()=>{
    supabase.from('clientes').select('id,nome,telefone,endereco').eq('ativo',true).order('nome').then(({data})=>setClientes(data||[]))
    supabase.from('usuarios').select('id,nome').eq('role','funcionario').eq('ativo',true).order('nome').then(({data})=>setFuncionarios(data||[]))
  },[])

  function selecionarCliente(id) {
    const c = clientes.find(x=>x.id===id)
    if(c) setForm({...form, cliente_id:c.id, cliente_nome:c.nome, cliente_telefone:c.telefone||'', cliente_endereco:c.endereco||''})
    else setForm({...form, cliente_id:''})
  }

  async function salvar() {
    if (!form.cliente_nome || !form.servico || !form.data || !form.hora) {
      setErro('Preencha nome do cliente, serviço, data e hora.'); return
    }
    const { error } = await supabase.from('agendamentos').insert([{
      cliente_id: form.cliente_id || null,
      cliente_nome: form.cliente_nome,
      cliente_telefone: form.cliente_telefone,
      cliente_endereco: form.cliente_endereco,
      funcionario_id: form.funcionario_id || null,
      servico: form.servico,
      data: form.data,
      hora: form.hora,
      status: form.status,
      valor: Number(form.valor) || 0,
      observacoes: form.observacoes,
    }])
    if (error) { setErro('Erro ao salvar: ' + error.message); return }
    router.push('/agendamentos')
  }

  const servicos = ['Limpeza residencial','Limpeza comercial','Manutenção','Instalação','Reparo elétrico','Conserto','Diagnóstico','Outro']

  const s = {
    box:{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:28,maxWidth:560},
    h2:{fontSize:16,fontWeight:600,marginBottom:20,color:t.text},
    err:{fontSize:12,color:'#a32d2d',background:'#fcebeb',padding:'8px 12px',borderRadius:8,marginBottom:16},
    fg:{marginBottom:14},
    label:{display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3},
    input:{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit',background:t.bgInput,color:t.text},
    row2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12},
    sec:{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:t.textSoft,margin:'16px 0 8px',paddingBottom:6,borderBottom:'1px solid '+t.borderSoft},
    btnRow:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:20},
    btnPrimary:{padding:'8px 18px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500,fontFamily:'inherit'},
    btnSecondary:{padding:'8px 18px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:13,cursor:'pointer',fontFamily:'inherit'},
  }

  return (
    <Layout title="Novo Agendamento">
      <div style={s.box}>
        <h2 style={s.h2}>Novo agendamento</h2>
        {erro && <div style={s.err}>{erro}</div>}

        <div style={s.sec}>CLIENTE</div>
        <div style={s.fg}><label style={s.label}>Selecionar cliente cadastrado</label>
          <select style={s.input} value={form.cliente_id} onChange={e=>selecionarCliente(e.target.value)}>
            <option value="">— Selecione ou preencha manualmente —</option>
            {clientes.map(c=><option key={c.id} value={c.id}>{c.nome} · {c.telefone}</option>)}
          </select>
        </div>
        <div style={s.row2}>
          <div style={s.fg}><label style={s.label}>Nome do cliente *</label><input style={s.input} value={form.cliente_nome} onChange={e=>setForm({...form,cliente_nome:e.target.value})} /></div>
          <div style={s.fg}><label style={s.label}>Telefone</label><input style={s.input} value={form.cliente_telefone} onChange={e=>setForm({...form,cliente_telefone:e.target.value})} /></div>
        </div>
        <div style={s.fg}><label style={s.label}>Endereço</label><input style={s.input} value={form.cliente_endereco} onChange={e=>setForm({...form,cliente_endereco:e.target.value})} /></div>

        <div style={s.sec}>SERVIÇO</div>
        <div style={s.fg}><label style={s.label}>Tipo de serviço *</label>
          <select style={s.input} value={form.servico} onChange={e=>setForm({...form,servico:e.target.value})}>
            <option value="">Selecione...</option>{servicos.map(sv=><option key={sv}>{sv}</option>)}
          </select>
        </div>
        <div style={s.row2}>
          <div style={s.fg}><label style={s.label}>Data *</label><input style={s.input} type="date" value={form.data} onChange={e=>setForm({...form,data:e.target.value})} /></div>
          <div style={s.fg}><label style={s.label}>Hora *</label><input style={s.input} type="time" value={form.hora} onChange={e=>setForm({...form,hora:e.target.value})} /></div>
        </div>
        <div style={s.row2}>
          <div style={s.fg}><label style={s.label}>Valor (R$)</label><input style={s.input} type="number" value={form.valor} onChange={e=>setForm({...form,valor:e.target.value})} /></div>
          <div style={s.fg}><label style={s.label}>Status</label>
            <select style={s.input} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
        </div>
        <div style={s.fg}><label style={s.label}>Funcionário responsável</label>
          <select style={s.input} value={form.funcionario_id} onChange={e=>setForm({...form,funcionario_id:e.target.value})}>
            <option value="">Selecione...</option>{funcionarios.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
        <div style={s.fg}><label style={s.label}>Observações</label><textarea style={{...s.input,minHeight:70,resize:'vertical'}} value={form.observacoes} onChange={e=>setForm({...form,observacoes:e.target.value})} /></div>

        <div style={s.btnRow}>
          <button style={s.btnSecondary} onClick={()=>router.push('/agendamentos')}>Cancelar</button>
          <button style={s.btnPrimary} onClick={salvar}>Salvar agendamento</button>
        </div>
      </div>
    </Layout>
  )
}
