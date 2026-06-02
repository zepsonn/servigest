import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Layout({ children, title = 'Dashboard' }) {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const u = localStorage.getItem('servigest_user')
    if (!u) { router.push('/'); return }
    setUser(JSON.parse(u))
  }, [])

  function logout() {
    localStorage.removeItem('servigest_user')
    router.push('/')
  }

  if (!user) return null
  const isGestor = user.role === 'gestor'

  const navGestor = [
    { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
    { href: '/clientes', icon: '👥', label: 'Clientes' },
    { href: '/os', icon: '🔧', label: 'Ordens de Serviço' },
    { href: '/agendamentos', icon: '📅', label: 'Agendamentos' },
    { href: '/recibo', icon: '🧾', label: 'Recibos' },
    { href: '/faturamento', icon: '📊', label: 'Faturamento' },
    { href: '/funcionarios', icon: '🪪', label: 'Funcionários' },
  ]
  const navFunc = [
    { href: '/dashboard', icon: '📅', label: 'Meus Serviços' },
    { href: '/os', icon: '🔧', label: 'Ordens de Serviço' },
    { href: '/historico', icon: '🕐', label: 'Histórico' },
    { href: '/clientes', icon: '👥', label: 'Clientes' },
  ]
  const nav = isGestor ? navGestor : navFunc

  return (
    <div style={s.app}>
      <div style={s.sidebar}>
        <div style={s.brandArea}>
          <div style={s.logoBox}>TI</div>
          <div>
            <div style={s.brandName}>Top Eletro</div>
            <div style={s.brandSlogan}>Inova</div>
          </div>
        </div>
        <div style={s.userPill}>
          <div style={{...s.avatar, background: isGestor ? '#9FE1CB' : '#B5D4F4', color: isGestor ? '#085041' : '#0C447C'}}>
            {user.nome.split(' ').map(n=>n[0]).slice(0,2).join('')}
          </div>
          <div>
            <div style={s.userName}>{user.nome}</div>
            <div style={s.userRole}>{isGestor ? '👑 Gestor' : '🔧 Técnico'}</div>
          </div>
        </div>
        <nav style={s.nav}>
          {nav.map(item => (
            <Link key={item.href} href={item.href} style={{...s.navItem, ...(router.pathname===item.href ? s.navActive : {})}}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        <button style={s.logoutBtn} onClick={logout}>↩ Sair</button>
      </div>
      <div style={s.main}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>{title}</div>
          {isGestor && (
            <div style={{display:'flex',gap:8}}>
              <Link href="/os" style={s.btnSm}>+ Nova OS</Link>
              <Link href="/recibo" style={{...s.btnSm,...s.btnPrimary}}>🧾 Recibo</Link>
            </div>
          )}
        </div>
        <div style={s.content}>{children}</div>
      </div>
    </div>
  )
}

const s = {
  app:{display:'flex',height:'100vh',overflow:'hidden'},
  sidebar:{width:220,borderRight:'1px solid #e8e8e8',display:'flex',flexDirection:'column',background:'#fafaf8',flexShrink:0},
  brandArea:{display:'flex',alignItems:'center',gap:10,padding:'14px 16px',borderBottom:'1px solid #e8e8e8'},
  logoBox:{width:38,height:38,borderRadius:8,background:'#1D9E75',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,flexShrink:0},
  brandName:{fontSize:15,fontWeight:700,lineHeight:1.2},
  brandSlogan:{fontSize:10,color:'#1D9E75',fontWeight:600},
  userPill:{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderBottom:'1px solid #e8e8e8'},
  avatar:{width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0},
  userName:{fontSize:12,fontWeight:500},
  userRole:{fontSize:10,color:'#888'},
  nav:{padding:'8px 10px',flex:1,display:'flex',flexDirection:'column',gap:2,overflow:'auto'},
  navItem:{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,fontSize:13,color:'#666'},
  navActive:{background:'#fff',color:'#1D9E75',fontWeight:500},
  logoutBtn:{margin:10,padding:'7px 10px',borderRadius:8,border:'1px solid #e0e0e0',background:'transparent',fontSize:12,cursor:'pointer',color:'#888',textAlign:'left'},
  main:{flex:1,overflow:'auto',display:'flex',flexDirection:'column'},
  topbar:{padding:'12px 24px',borderBottom:'1px solid #e8e8e8',background:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0},
  topbarTitle:{fontSize:16,fontWeight:500},
  content:{padding:'20px 24px',flex:1,overflow:'auto'},
  btnSm:{display:'inline-flex',alignItems:'center',padding:'5px 12px',borderRadius:8,border:'1px solid #e0e0e0',fontSize:12,fontWeight:500,color:'#1a1a1a',background:'#fff'},
  btnPrimary:{background:'#1D9E75',color:'#fff',border:'1px solid #1D9E75'},
}
