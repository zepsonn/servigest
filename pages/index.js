import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username.trim().toLowerCase())
      .eq('senha', senha)
      .eq('ativo', true)
      .single()
    setLoading(false)
    if (error || !data) { setErro('Usuário ou senha incorretos.'); return }
    localStorage.setItem('servigest_user', JSON.stringify(data))
    router.push('/dashboard')
  }

  return (
    <div style={s.page}>
      <div style={s.box}>
        <div style={s.logo}>Servi<span style={{color:'#1D9E75'}}>Gest</span></div>
        <p style={s.sub}>Entre com sua conta para continuar</p>
        {erro && <div style={s.err}>{erro}</div>}
        <form onSubmit={handleLogin}>
          <div style={s.fg}>
            <label style={s.label}>Usuário</label>
            <input style={s.input} value={username} onChange={e=>setUsername(e.target.value)} placeholder="seu.usuario" autoFocus />
          </div>
          <div style={s.fg}>
            <label style={s.label}>Senha</label>
            <input style={s.input} type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" />
          </div>
          <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  )
}

const s = {
  page: {display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',background:'#f5f5f3'},
  box: {background:'#fff',border:'1px solid #e8e8e8',borderRadius:12,padding:32,width:340},
  logo: {fontSize:24,fontWeight:700,marginBottom:4},
  sub: {fontSize:13,color:'#888',marginBottom:24},
  err: {fontSize:12,color:'#a32d2d',background:'#fcebeb',padding:'8px 12px',borderRadius:8,marginBottom:16},
  fg: {marginBottom:14},
  label: {display:'block',fontSize:11,color:'#888',fontWeight:500,marginBottom:3},
  input: {width:'100%',padding:'8px 11px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:14,fontFamily:'inherit'},
  btn: {width:'100%',padding:10,background:'#1D9E75',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:500,cursor:'pointer',marginTop:4},
}
