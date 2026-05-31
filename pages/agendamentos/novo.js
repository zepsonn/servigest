import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function NovoAgendamento() {
  const [clientes, setClientes] = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [form, setForm] = useState({cliente_id:'',funcionario_id:'',servico:'',data:'',hora:'',status:'agendado',observacoes:''})
  const [erro, setErro] = useState('')
  const router = useRouter()

  useEffect(()=>{
    supabase.from('clientes').select('id,nome').eq('ativo',true).order('nome').then(({data})=>setClientes(data||[]))
    supabase.from('usuarios').select('id,nome').eq('role','funcionario').eq('ativo',true).order('nome').then(({data})=>setFuncionarios(data||[]))
  },[])

  async function salvar() {
    if (!form.cliente_id || !form.funcionario_id || !form.servico || !form.data || !form.hora) { setErro('Preencha todos os campos obrigatórios.'); return }
    const { error } = await supabase.from('agendamentos').insert([form])
    if (error) { setErro('Erro ao salvar.'); return }
    router.push('/agendamentos')
  }

  const servicos = ['Limpeza residencial','Limpeza comercial','Manutenção','Jardinagem','Outro']

  return (
    <Layout title="Novo Agendamento">
      <div style={s.box}>
        <h2 style={s.h2}>Novo agendamento</h2>
        {erro && <div style={s.err}>{erro}</div>}
        <div style={s.fg}><label style={s.label}>Cliente *</label>
          <select style={s.input} value={form.cliente_id} onChange={e=>setForm({...form,cliente_id:e.target.value})}>
            <option value="">Selecione...</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div style={s.fg}><label style={s.label}>Funcionário responsável *</label>
          <select style={s.input} value={form.funcionario_id} onChange={e=>setForm({...form,funcionario_id:e.target.value})}>
            <option value="">Selecione...</option>{funcionarios.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
        <div style={s.fg}><label style={s.label}>Tipo de serviço *</label>
          <select style={s.input} value={form.servico} onChange={e=>setForm({...form,servico:e.target.value})}>
            <option value="">Selecione...</option>{servicos.map(sv=><option key={sv}>{sv}</option>)}
          </select>
        </div>
        <div style={s.row2}>
          <div style={s.fg}><label style={s.label}>Data *</label><input style={s.input} type="date" value={form.data} onChange={e=>setForm({...form,data:e.target.value})} /></div>
          <div style={s.fg}><label style={s.label}>Hora *</label><input style={s.input} type="time" value={form.hora} onChange={e=>setForm({...form,hora:e.target.value})} /></div>
        </div>
        <div style={s.fg}><label style={s.label}>Status</label>
          <select style={s.input} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
            {['agendado','confirmado','pendente'].map(st=><option key={st}>{st}</option>)}
          </select>
        </div>
        <div style={s.fg}><label style={s.label}>Observações</label><textarea style={{...s.input,minHeight:70}} value={form.observacoes} onChange={e=>setForm({...form,observacoes:e.target.value})} /></div>
        <div style={s.btnRow}>
          <button style={s.btnSecondary} onClick={()=>router.push('/agendamentos')}>Cancelar</button>
          <button style={s.btnPrimary} onClick={salvar}>Salvar agendamento</button>
        </div>
      </div>
    </Layout>
  )
}

const s = {
  box:{background:'#fff',border:'1px solid #e8e8e8',borderRadius:12,padding:28,maxWidth:540},
  h2:{fontSize:16,fontWeight:600,marginBottom:20},
  err:{fontSize:12,color:'#a32d2d',background:'#fcebeb',padding:'8px 12px',borderRadius:8,marginBottom:16},
  fg:{marginBottom:14},
  label:{display:'block',fontSize:11,color:'#888',fontWeight:500,marginBottom:3},
  input:{width:'100%',padding:'7px 10px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:13,fontFamily:'inherit'},
  row2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12},
  btnRow:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:20},
  btnPrimary:{padding:'8px 18px',borderRadius:8,background:'#1D9E75',color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500,fontFamily:'inherit'},
  btnSecondary:{padding:'8px 18px',borderRadius:8,background:'transparent',color:'#666',border:'1px solid #e0e0e0',fontSize:13,cursor:'pointer',fontFamily:'inherit'},
}
