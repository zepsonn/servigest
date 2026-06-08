import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useTheme } from '../lib/theme'

const LOGO_SRC = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAICAgICAgQCAgQGBAQEBggGBgYGCAoICAgICAoMCgoKCgoKDAwMDAwMDAwODg4ODg4QEBAQEBISEhISEhISEhL/2wBDAQMDAwUEBQgEBAgTDQsNExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExP/wAARCAFAAUADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAKqgMBmnk4r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"

export default function Layout({ children, title = 'Dashboard' }) {
  const [user, setUser] = useState(null)
  const [temaAberto, setTemaAberto] = useState(false)
  const router = useRouter()
  const { t, mode, accent, changeMode, changeAccent } = useTheme()

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
    { href: '/dashboard', icon: 'DASH', label: 'Dashboard' },
    { href: '/os', icon: 'OS', label: 'Ordens de Servico' },
    { href: '/agendamentos', icon: 'AGD', label: 'Agendamentos' },
    { href: '/recibo', icon: 'REC', label: 'Recibos' },
    { href: '/faturamento', icon: 'FAT', label: 'Faturamento' },
    { href: '/funcionarios', icon: 'FUN', label: 'Funcionarios' },
  ]
  const navFunc = [
    { href: '/dashboard', icon: 'AGD', label: 'Meus Servicos' },
    { href: '/os', icon: 'OS', label: 'Ordens de Servico' },
    { href: '/historico', icon: 'HIST', label: 'Historico' },
  ]
  const emoji = {DASH:'\u{1F4CA}',OS:'\u{1F527}',AGD:'\u{1F4C5}',REC:'\u{1F9FE}',FAT:'\u{1F4B0}',FUN:'\u{1FAAA}',HIST:'\u{1F550}'}
  const nav = isGestor ? navGestor : navFunc

  const s = {
    app:{display:'flex',height:'100vh',overflow:'hidden',background:t.bg,color:t.text},
    sidebar:{width:220,borderRight:'1px solid '+t.border,display:'flex',flexDirection:'column',background:t.bgSidebar,flexShrink:0},
    brandArea:{display:'flex',alignItems:'center',gap:10,padding:'14px 16px 12px',borderBottom:'1px solid '+t.border},
    logoImg:{width:40,height:40,borderRadius:8,objectFit:'contain',flexShrink:0,background:'#fff',border:'1px solid '+t.borderSoft},
    brandName:{fontSize:15,fontWeight:700,lineHeight:1.2,color:t.text},
    brandSlogan:{fontSize:11,color:t.accent,fontWeight:600},
    nav:{padding:'8px 10px',flex:1,display:'flex',flexDirection:'column',gap:2,overflow:'auto'},
    navItem:{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,fontSize:13,color:t.textSoft},
    navActive:{background:t.bgCard,color:t.accent,fontWeight:500},
    themeBtn:{margin:'0 10px',padding:'8px 10px',borderRadius:8,border:'1px solid '+t.border,background:'transparent',fontSize:12,cursor:'pointer',color:t.textSoft,textAlign:'left',display:'flex',alignItems:'center',gap:6},
    logoutBtn:{margin:10,padding:'7px 10px',borderRadius:8,border:'1px solid '+t.border,background:'transparent',fontSize:12,cursor:'pointer',color:t.textSoft,textAlign:'left'},
    main:{flex:1,overflow:'auto',display:'flex',flexDirection:'column',background:t.bg},
    topbar:{padding:'12px 24px',borderBottom:'1px solid '+t.border,background:t.bgCard,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0},
    topbarTitle:{fontSize:16,fontWeight:500,color:t.text},
    content:{padding:'20px 24px',flex:1,overflow:'auto'},
    btnSm:{display:'inline-flex',alignItems:'center',padding:'5px 12px',borderRadius:8,border:'1px solid '+t.border,fontSize:12,fontWeight:500,color:t.text,background:t.bgCard},
    btnPrimary:{background:t.accent,color:'#fff',border:'1px solid '+t.accent},
    popover:{margin:'4px 10px 0',padding:12,borderRadius:10,border:'1px solid '+t.border,background:t.bgCard},
    popLabel:{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:t.textSoft,marginBottom:6},
    optRow:{display:'flex',gap:4,marginBottom:10},
    opt:(active)=>({flex:1,padding:'5px 0',borderRadius:6,border:'1px solid '+(active?t.accent:t.border),background:active?t.accentSoft:'transparent',color:active?t.accentDark:t.textSoft,fontSize:11,cursor:'pointer',fontWeight:active?600:400,textAlign:'center'}),
    colorDot:(color,active)=>({width:26,height:26,borderRadius:'50%',background:color,cursor:'pointer',border:active?'3px solid '+t.text:'2px solid '+t.border,flexShrink:0}),
  }

  return (
    <div style={s.app}>
      <div style={s.sidebar}>
        <div style={s.brandArea}>
          <img src={LOGO_SRC} alt="Top Eletro Inova" style={s.logoImg} />
          <div>
            <div style={s.brandName}>Top Eletro</div>
            <div style={s.brandSlogan}>Inova</div>
          </div>
        </div>
        <nav style={s.nav}>
          {nav.map(item => (
            <Link key={item.href} href={item.href} style={{...s.navItem, ...(router.pathname===item.href ? s.navActive : {})}}>
              <span>{emoji[item.icon]}</span> {item.label}
            </Link>
          ))}
        </nav>
        <button style={s.themeBtn} onClick={()=>setTemaAberto(!temaAberto)}>
          {t.dark ? '\u{1F319}' : '\u2600\uFE0F'} Tema {temaAberto ? '\u25B2' : '\u25BC'}
        </button>
        {temaAberto && (
          <div style={s.popover}>
            <div style={s.popLabel}>Aparencia</div>
            <div style={s.optRow}>
              {[['claro','Claro'],['escuro','Escuro'],['auto','Auto']].map(([v,l])=>(
                <div key={v} style={s.opt(mode===v)} onClick={()=>changeMode(v)}>{l}</div>
              ))}
            </div>
            <div style={s.popLabel}>Cor de destaque</div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <div style={s.colorDot('#1D9E75', accent==='verde')} onClick={()=>changeAccent('verde')} title="Verde" />
              <div style={s.colorDot('#2563EB', accent==='azul')} onClick={()=>changeAccent('azul')} title="Azul" />
            </div>
          </div>
        )}
        <button style={s.logoutBtn} onClick={logout}>{'\u21A9'} Sair</button>
      </div>
      <div style={s.main}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>{title}</div>
          {isGestor && (
            <div style={{display:'flex',gap:8}}>
              <Link href="/os" style={s.btnSm}>+ Nova OS</Link>
              <Link href="/recibo" style={{...s.btnSm,...s.btnPrimary}}>{'\u{1F9FE}'} Recibo</Link>
            </div>
          )}
        </div>
        <div style={s.content}>{children}</div>
      </div>
    </div>
  )
}
