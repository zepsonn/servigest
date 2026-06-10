import { useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import { useRouter } from 'next/router'

const BAIRROS_CURITIBA = [
  'Abranches','Água Verde','Ahú','Alto Boqueirão','Alto da Glória','Alto da Rua XV',
  'Atuba','Augusta','Bacacheri','Bairro Alto','Barreirinha','Boa Vista','Bom Retiro',
  'Boqueirão','Butiatuvinha','Cabral','Cachoeira','Cajuru','Campo Comprido','Campo de Santana',
  'Capão da Imbuia','Capão Raso','Cascatinha','Caximba','Centro','Centro Cívico',
  'Cristo Rei','Fanny','Fazendinha','Ganchinho','Guaíra','Guabirotuba','Hauer',
  'Hugo Lange','Jardim Botânico','Jardim das Américas','Jardim Social','Juvevê',
  'Lamenha Pequena','Lindóia','Mercês','Mossunguê','Novo Mundo',
  'Orleans','Parolin','Pilarzinho','Pinheirinho','Portão','Prado Velho',
  'Rebouças','Santa Cândida','Santa Felicidade','Santa Quitéria','Santo Inácio',
  'São Braz','São Francisco','São João','São Lourenço','São Miguel','Seminário',
  'Sítio Cercado','Taboão','Tatuquara','Tingui','Uberaba','Umbará',
  'Vila Izabel','Vila Leão','Vista Alegre','Xaxim',
  'Sao Jose dos Pinhais - Centro','Sao Jose dos Pinhais - Afonso Pena','Sao Jose dos Pinhais - Borda do Campo',
  'Sao Jose dos Pinhais - Costeira','Sao Jose dos Pinhais - Guatupe','Sao Jose dos Pinhais - Ipelandia',
  'Sao Jose dos Pinhais - Jardim Elite','Sao Jose dos Pinhais - Jurema','Sao Jose dos Pinhais - Quissisana',
  'Sao Jose dos Pinhais - Roça Grande','Sao Jose dos Pinhais - Zacarias',
  'Piraquara - Centro','Piraquara - Guarituba','Piraquara - Jardim Primavera','Piraquara - Moradias Belém',
  'Colombo - Centro','Colombo - Atuba','Colombo - Bacacheri','Colombo - Maracanã','Colombo - Monza',
  'Colombo - Palmital','Colombo - Roça Grande','Colombo - São Gabriel',
  'Araucária - Centro','Araucária - Cachoeira','Araucária - Costeira','Araucária - Iguaçu',
  'Araucária - Jardim Ipê','Araucária - Sabiá','Araucária - Thomaz Coelho'
].sort()

const MODELO_MENSAGEM = `Olá! Para agendarmos seu serviço, por favor responda preenchendo após os dois pontos:

Nome:
Telefone:
Endereço:
Bairro:
Produto/Equipamento:
Problema/Defeito:

Agradecemos o contato!
Top Eletro - Inova
(41) 99846-1851`

export default function Importar() {
  const [texto, setTexto] = useState('')
  const [interpretando, setInterpretando] = useState(false)
  const [form, setForm] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [tecnicos, setTecnicos] = useState([])
  const [copiado, setCopiado] = useState(false)
  const { t } = useTheme()
  const router = useRouter()

  useState(()=>{
    supabase.from('usuarios').select('id,nome').eq('ativo',true).order('nome').then(({data})=>setTecnicos(data||[]))
  })

  function interpretar() {
    if (!texto.trim()) { alert('Cole a mensagem do cliente primeiro'); return }
    setInterpretando(true)

    // extrai valor após "campo:" — funciona com ou sem espaço, maiúsculas/minúsculas
    function extrair(campos) {
      const linhas = texto.split('\n')
      for (const campo of campos) {
        for (const linha of linhas) {
          const regex = new RegExp(campo + '\\s*:?\\s*(.+)', 'i')
          const match = linha.match(regex)
          if (match && match[1].trim()) return match[1].trim()
        }
      }
      return ''
    }

    // tenta identificar bairro de Curitiba na mensagem
    function encontrarBairro() {
      const bairroExtraido = extrair(['bairro','Bairro','BAIRRO'])
      if (bairroExtraido) {
        // verifica se bate com algum bairro conhecido
        const found = BAIRROS_CURITIBA.find(b => 
          b.toLowerCase() === bairroExtraido.toLowerCase() ||
          bairroExtraido.toLowerCase().includes(b.toLowerCase())
        )
        return found || bairroExtraido
      }
      // tenta achar bairro no texto todo
      const textoLower = texto.toLowerCase()
      return BAIRROS_CURITIBA.find(b => textoLower.includes(b.toLowerCase())) || ''
    }

    setTimeout(() => {
      const nome = extrair(['nome','Nome','NOME','cliente','Cliente'])
      const telefone = extrair(['telefone','Telefone','TELEFONE','fone','celular','whatsapp','contato'])
      const endereco = extrair(['endereço','endereco','Endereço','Endereco','ENDERECO','rua','Rua','logradouro'])
      const bairro = encontrarBairro()
      const produto = extrair(['produto','Produto','PRODUTO','equipamento','Equipamento','aparelho','Aparelho','eletrodoméstico'])
      const problema = extrair(['problema','Problema','PROBLEMA','defeito','Defeito','DEFEITO','serviço','servico','Serviço','Servico','falha'])
      const descricao = extrair(['descrição','descricao','Descrição','Descricao','observação','observacao','detalhes'])

      setForm({
        cliente_nome: nome,
        cliente_telefone: telefone,
        cliente_endereco: endereco,
        bairro: bairro,
        produto: produto,
        servico: problema || descricao,
        descricao: descricao || problema,
        valor: 0,
        status: 'em_andamento',
        periodo: '',
        tecnico_id: '',
        data_entrada: new Date().toISOString().split('T')[0],
        observacoes: '',
      })
      setInterpretando(false)
    }, 600)
  }

  async function salvarOS() {
    if (!form.cliente_nome) { alert('Nome do cliente é obrigatório'); return }
    setSalvando(true)
    const { error } = await supabase.from('ordens_servico').insert([{
      cliente_nome: form.cliente_nome,
      cliente_telefone: form.cliente_telefone,
      cliente_endereco: form.cliente_endereco,
      bairro: form.bairro||null,
      produto: form.produto,
      servico: form.servico,
      descricao: form.descricao,
      valor: Number(form.valor)||0,
      status: form.status,
      periodo: form.periodo||null,
      tecnico_id: form.tecnico_id||null,
      data_entrada: form.data_entrada,
      observacoes: form.observacoes,
    }])
    setSalvando(false)
    if (!error) {
      alert('OS criada com sucesso!')
      router.push('/os')
    } else {
      alert('Erro ao salvar: ' + error.message)
    }
  }

  function copiarModelo() {
    navigator.clipboard.writeText(MODELO_MENSAGEM)
    setCopiado(true)
    setTimeout(()=>setCopiado(false), 2000)
  }

  const inp = {width:'100%',padding:'9px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:14,fontFamily:'inherit',background:t.bgInput,color:t.text}
  const lbl = {display:'block',fontSize:11,color:t.textSoft,fontWeight:500,marginBottom:3}
  const row2 = {display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}

  return (
    <Layout title="Importar OS pelo WhatsApp">
      <div style={{maxWidth:640,margin:'0 auto'}}>

        {/* PASSO 1 — MODELO */}
        <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:600,color:t.text,marginBottom:4}}>1. Copie o modelo e envie para o cliente</div>
          <div style={{fontSize:12,color:t.textSoft,marginBottom:12}}>Mande essa mensagem no WhatsApp para o cliente preencher.</div>
          <pre style={{background:t.bgSidebar,border:'1px solid '+t.borderSoft,borderRadius:8,padding:14,fontSize:13,color:t.text,whiteSpace:'pre-wrap',marginBottom:12,fontFamily:'inherit'}}>{MODELO_MENSAGEM}</pre>
          <button onClick={copiarModelo} style={{padding:'8px 16px',borderRadius:8,background:copiado?'#3B6D11':t.accent,color:'#fff',border:'none',fontSize:13,cursor:'pointer',fontWeight:500}}>
            {copiado ? '✓ Copiado!' : 'Copiar modelo'}
          </button>
        </div>

        {/* PASSO 2 — COLAR RESPOSTA */}
        <div style={{background:t.bgCard,border:'1px solid '+t.border,borderRadius:12,padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:600,color:t.text,marginBottom:4}}>2. Cole a resposta do cliente aqui</div>
          <div style={{fontSize:12,color:t.textSoft,marginBottom:12}}>Copie a mensagem de resposta do cliente e cole abaixo.</div>
          <textarea
            style={{...inp,minHeight:140,resize:'vertical',marginBottom:12}}
            placeholder="Cole aqui a resposta do cliente..."
            value={texto}
            onChange={e=>setTexto(e.target.value)}
          />
          <button onClick={interpretar} disabled={interpretando} style={{padding:'10px 20px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:14,cursor:'pointer',fontWeight:600,opacity:interpretando?0.7:1}}>
            {interpretando ? 'Interpretando...' : 'Interpretar com IA'}
          </button>
        </div>

        {/* PASSO 3 — REVISAR E SALVAR */}
        {form && (
          <div style={{background:t.bgCard,border:'1px solid '+t.accent,borderRadius:12,padding:20}}>
            <div style={{fontSize:14,fontWeight:600,color:t.text,marginBottom:4}}>3. Revise e salve a OS</div>
            <div style={{fontSize:12,color:t.textSoft,marginBottom:16}}>A IA preencheu os campos abaixo. Confira e ajuste se necessário.</div>

            <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:t.textSoft,marginBottom:8,paddingBottom:6,borderBottom:'1px solid '+t.borderSoft}}>CLIENTE</div>
            <div style={row2}>
              <div style={{marginBottom:12}}><label style={lbl}>Nome *</label><input style={inp} value={form.cliente_nome} onChange={e=>setForm({...form,cliente_nome:e.target.value})}/></div>
              <div style={{marginBottom:12}}><label style={lbl}>Telefone</label><input style={inp} value={form.cliente_telefone} onChange={e=>setForm({...form,cliente_telefone:e.target.value})}/></div>
            </div>
            <div style={row2}>
              <div style={{marginBottom:12}}><label style={lbl}>Endereço</label><input style={inp} value={form.cliente_endereco} onChange={e=>setForm({...form,cliente_endereco:e.target.value})}/></div>
              <div style={{marginBottom:12}}><label style={lbl}>Bairro</label>
                <select style={inp} value={form.bairro} onChange={e=>setForm({...form,bairro:e.target.value})}>
                  <option value="">Selecione...</option>
                  {BAIRROS_CURITIBA.map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:t.textSoft,margin:'8px 0',paddingBottom:6,borderBottom:'1px solid '+t.borderSoft}}>SERVIÇO</div>
            <div style={row2}>
              <div style={{marginBottom:12}}><label style={lbl}>Produto/Equipamento</label><input style={inp} value={form.produto} onChange={e=>setForm({...form,produto:e.target.value})}/></div>
              <div style={{marginBottom:12}}><label style={lbl}>Serviço</label><input style={inp} value={form.servico} onChange={e=>setForm({...form,servico:e.target.value})}/></div>
            </div>
            <div style={{marginBottom:12}}><label style={lbl}>Descrição do problema</label><textarea style={{...inp,minHeight:70,resize:'vertical'}} value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})}/></div>

            <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:t.textSoft,margin:'8px 0',paddingBottom:6,borderBottom:'1px solid '+t.borderSoft}}>AGENDAMENTO</div>
            <div style={row2}>
              <div style={{marginBottom:12}}><label style={lbl}>Data</label><input type="date" style={inp} value={form.data_entrada} onChange={e=>setForm({...form,data_entrada:e.target.value})}/></div>
              <div style={{marginBottom:12}}><label style={lbl}>Período</label>
                <select style={inp} value={form.periodo} onChange={e=>setForm({...form,periodo:e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
                </select>
              </div>
            </div>
            <div style={row2}>
              <div style={{marginBottom:12}}><label style={lbl}>Valor (R$)</label><input type="number" style={inp} value={form.valor} onChange={e=>setForm({...form,valor:e.target.value})}/></div>
              <div style={{marginBottom:12}}><label style={lbl}>Técnico</label>
                <select style={inp} value={form.tecnico_id} onChange={e=>setForm({...form,tecnico_id:e.target.value})}>
                  <option value="">Selecione...</option>
                  {tecnicos.map(tc=><option key={tc.id} value={tc.id}>{tc.nome}</option>)}
                </select>
              </div>
            </div>

            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
              <button style={{padding:'10px 16px',borderRadius:8,background:'transparent',color:t.textSoft,border:'1px solid '+t.border,fontSize:14,cursor:'pointer'}} onClick={()=>setForm(null)}>Cancelar</button>
              <button style={{padding:'10px 20px',borderRadius:8,background:t.accent,color:'#fff',border:'none',fontSize:14,cursor:'pointer',fontWeight:600,opacity:salvando?0.7:1}} onClick={salvarOS} disabled={salvando}>
                {salvando?'Salvando...':'Salvar OS'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
