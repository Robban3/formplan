import { useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white">
        <p className="text-red-400 text-sm">Inloggning är inte konfigurerad.</p>
      </div>
    )
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const redirectTo = `${window.location.origin}/auth`
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  async function handleGoogle() {
    setError(null)
    const redirectTo = `${window.location.origin}/auth`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{
      backgroundImage: `url('/image-1780947666657.webp')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />

      {/* Main content */}
      <div className="relative flex flex-1 z-10 items-center justify-center gap-16 px-12 py-10">
        {/* Left — logo + text */}
        <div className="flex flex-col justify-between" style={{ width: '380px' }}>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FormPlan" style={{ height: '40px', width: 'auto' }} />
          </div>

          {/* Hero text */}
          <div className="mb-16">
            <h1 className="font-extrabold leading-tight mb-4" style={{ fontSize: '44px' }}>
              <span className="text-[#22e6c6]">AI-genererat</span>{' '}
              <span className="text-white">tränings-<br />&amp; kostschema</span>
            </h1>
            <p className="text-slate-300 text-base leading-relaxed max-w-sm">
              Personliga tränings- och kostscheman anpassade för dig. Drivna av AI.
            </p>
          </div>
        </div>

        {/* Right — login card */}
        <div style={{ width: '580px', flexShrink: 0,
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 60px rgba(34,230,198,0.2), 0 0 120px rgba(34,230,198,0.08), 0 25px 50px rgba(0,0,0,0.5)',
          borderRadius: '20px',
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ width: '100%', maxWidth: '380px' }}>
            <div>
              <div style={{ maxWidth: '380px', margin: '0 auto' }}>
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <img src="/logo.png" alt="FormPlan" style={{ height: '72px', width: 'auto' }} />
              </div>

              {sent ? (
                <div className="text-center py-4">
                  <p className="text-white font-semibold text-lg mb-2">Kolla din e-post!</p>
                  <p className="text-slate-400 text-sm">Vi skickade en inloggningslänk till {email}</p>
                </div>
              ) : (
                <>
                  <h2 className="text-white text-2xl font-bold text-center mb-1">Välkommen tillbaka</h2>
                  <p className="text-slate-400 text-sm text-center mb-7">Logga in för att fortsätta din resa</p>

                  <button onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold py-4 rounded-xl mb-5 hover:bg-slate-100 transition-colors text-sm">
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Fortsätt med Google
                  </button>

                  <div className="relative mb-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 text-slate-500" style={{ background: 'transparent' }}>eller</span>
                    </div>
                  </div>

                  <form onSubmit={handleMagicLink} className="space-y-3">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="din@epost.se" required
                        className="w-full pl-11 pr-4 py-4 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#22e6c6]/50 transition-all"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                      />
                    </div>
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <button type="submit" disabled={loading}
                      className="w-full flex items-center justify-between px-5 py-4 rounded-xl text-sm font-semibold text-slate-900 transition-all disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #22e6c6 0%, #10c4a8 100%)' }}>
                      <span>{loading ? 'Skickar...' : 'Skicka inloggningslänk'}</span>
                      {!loading && (
                        <svg className="w-4 h-4 stroke-slate-900" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      )}
                    </button>
                  </form>

                  <div className="flex items-center justify-center gap-2 mt-5 text-slate-500 text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Säker och krypterad inloggning
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom feature bar */}
      <div className="relative z-10 border-t px-10 py-5" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)' }}>
        <div className="flex items-start justify-between gap-6 max-w-5xl mx-auto">
          {[
            { d: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z', title: 'Sparar tid', desc: 'AI skapar ditt schema på några sekunder' },
            { d: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: '100% personligt', desc: 'Anpassat efter dina mål, förutsättningar och preferenser' },
            { d: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941', title: 'Baserat på forskning', desc: 'Vetenskapliga metoder för maximala resultat' },
            { d: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z', title: 'Säkert & tryggt', desc: 'Din data är alltid skyddad' },
            { d: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z', title: 'Byggt för resultat', desc: 'Fokus på långsiktiga resultat' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 flex-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(34,230,198,0.15)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#22e6c6">
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.d} />
                </svg>
              </div>
              <div>
                <p className="text-white text-xs font-semibold">{f.title}</p>
                <p className="text-slate-500 text-[11px] leading-tight mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
