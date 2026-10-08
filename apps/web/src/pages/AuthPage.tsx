import { useEffect, useState, useSyncExternalStore } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import {
  endPasswordRecovery,
  getRecoveryState,
  subscribePasswordRecovery,
} from '../lib/authRecovery'
import { authRedirectUrl, isNativeApp, openExternalAuth } from '../lib/authRedirect'
import { toast } from '../lib/toast'
import { useT } from '../hooks/useT'
import type { TranslateFn } from '../lib/i18n'

/**
 * Översätt de vanligaste GoTrue-felen.
 *
 * Mönstren matchar GoTrues ENGELSKA meddelanden och ändras inte med språket —
 * det är serverns text, inte vår. Bara svaret översätts, så `t` skickas in.
 */
export function translateAuthError(msg: string, t: TranslateFn): string {
  const m = msg.toLowerCase()
  // Fel lösenord, okänd adress och obekräftad adress måste ge EXAKT samma svar —
  // annars går det att ta reda på vilka e-postadresser som har konto. Hjälpen om
  // bekräftelsemejlet ligger därför i samma text som fel lösenord ger.
  if (m.includes('invalid login') || m.includes('email not confirmed'))
    return t('auth.err.invalidLogin')
  // Samma neutrala besked som vid lyckad registrering (se isObfuscatedExistingUser).
  if (m.includes('already registered') || m.includes('already been registered'))
    return t('auth.neutralSignupNotice')
  // Länken är använd/utgången, eller sessionen hann rensas innan formuläret
  // skickades. Skulle annars visas rått på engelska ("Auth session missing!").
  if (m.includes('session missing') || m.includes('session_not_found') || m.includes('session not found'))
    return t('auth.err.linkInvalid')
  // GoTrues egen throttling ("For security purposes, you can only request this
  // after 47 seconds") — skulle annars visas rå på engelska.
  if (m.includes('for security purposes') || m.includes('only request this'))
    return t('auth.err.throttled')
  if (m.includes('rate limit') || m.includes('too many')) return t('auth.err.tooMany')
  if (m.includes('known to be weak') || m.includes('pwned'))
    return t('auth.err.pwned')
  // Kravet på lösenordet sätts i projektets Supabase-inställningar (längd,
  // teckenklasser). Påstå därför ALDRIG en siffra här — säg att kraven inte är
  // uppfyllda och visa serverns egen beskrivning.
  if (
    m.includes('password should be') ||
    m.includes('password should contain') ||
    m.includes('one character of each') ||
    m.includes('weak password')
  ) {
    return t('auth.err.weakPassword', { detail: msg })
  }
  return msg
}

/** Supabase döljer om adressen redan finns: user utan identities = befintligt konto. */
function isObfuscatedExistingUser(user: { identities?: unknown[] | null } | null): boolean {
  return !!user && (user.identities?.length ?? 0) === 0
}

/**
 * Kravet sätts i projektets Supabase-inställningar. Höjs det där utan att den
 * här siffran följer med lovar formuläret "minst 6 tecken" och servern säger
 * nej — därför läses den ur miljön i stället för att vara hårdkodad.
 */
const MIN_PASSWORD_LENGTH = (() => {
  const raw = Number(import.meta.env.VITE_SUPABASE_MIN_PASSWORD_LENGTH)
  return Number.isFinite(raw) && raw >= 6 && raw <= 72 ? Math.floor(raw) : 6
})()

export function AuthPage() {
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [isSignup, setIsSignup] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // Återställningsläget ägs av authRecovery (lyssnaren ligger på modulnivå där,
  // så den är armad även när den här vyn inte är monterad).
  const recoveryState = useSyncExternalStore(
    subscribePasswordRecovery,
    getRecoveryState,
    () => 'none' as const
  )
  // Formuläret visas BARA när PASSWORD_RECOVERY faktiskt kommit. En markör i
  // adressen räcker inte — se kommentaren i authRecovery.ts.
  const recovering = recoveryState === 'active'
  const verifyingLink = recoveryState === 'pending'

  const busy = loading || googleLoading

  // En utgången eller redan använd länk landar på #error=… utan type=recovery.
  // Utan det här står användaren på en vanlig inloggningsruta och tror att
  // återställningen gick igenom.
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.includes('error')) return
    const params = new URLSearchParams(hash.replace(/^#/, ''))
    const code = params.get('error_code')
    const description = params.get('error_description')
    if (!code && !description) return
    setError(
      code === 'otp_expired' || /expired|invalid/i.test(description ?? '')
        ? t('auth.linkExpired')
        : translateAuthError(description ?? t('auth.err.linkUnverified'), t)
    )
    // Rensa hashen så felet inte kommer tillbaka vid navigering i appen.
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [])

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white">
        <p className="text-red-400 text-sm">{t('auth.err.notConfigured')}</p>
      </div>
    )
  }

  /** auth-js kastar vidare allt som inte är ett AuthError (t.ex. blockerad storage). */
  function unexpected(e: unknown): string {
    return e instanceof Error
      ? translateAuthError(e.message, t)
      : t('auth.err.generic')
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const redirectTo = authRedirectUrl()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      })
      if (error) setError(translateAuthError(error.message, t))
      else setSent(true)
    } catch (err) {
      setError(unexpected(err))
    } finally {
      setLoading(false)
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)
    setNotice(null)
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.passwordTooShort', { min: MIN_PASSWORD_LENGTH }))
      return
    }
    setLoading(true)
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: authRedirectUrl() },
        })
        if (error) {
          setError(translateAuthError(error.message, t))
          return
        }
        // Med Supabases skydd mot e-postuppräkning svarar en redan registrerad
        // adress med 200, utan session och med en användare som saknar
        // identities — och inget mejl skickas. Ett grönt "Konto skapat!" hade
        // fått användaren att vänta på ett mejl som aldrig kommer.
        if (isObfuscatedExistingUser(data.user)) {
          setNotice(
            t('auth.neutralSignupNotice')
          )
          return
        }
        // Ingen session ⇒ Supabase kräver e-postbekräftelse. Med session är
        // användaren redan inloggad och onAuthStateChange sköter redirect.
        if (!data.session) {
          setNotice(t('auth.accountCreatedCheckMail'))
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(translateAuthError(error.message, t))
        // Vid lyckad inloggning triggar onAuthStateChange navigeringen.
      }
    } catch (err) {
      setError(unexpected(err))
    } finally {
      setLoading(false)
    }
  }

  /** Skickar återställningslänk. Svaret är neutralt — det avslöjar inte om kontot finns. */
  async function handleForgotPassword() {
    if (busy) return
    setError(null)
    setNotice(null)
    if (!email.trim()) {
      setError(t('auth.needEmailFirst'))
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: authRedirectUrl(),
      })
      if (error) setError(translateAuthError(error.message, t))
      else
        setNotice(
          t('auth.resetSent')
        )
    } catch (err) {
      setError(unexpected(err))
    } finally {
      setLoading(false)
    }
  }

  /** Sätter det nya lösenordet för sessionen som återställningslänken gav. */
  async function handleSetNewPassword(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)
    setNotice(null)
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.passwordTooShort', { min: MIN_PASSWORD_LENGTH }))
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setError(translateAuthError(error.message, t))
        return
      }
      setNewPassword('')
      // Sessionen är redan inloggad — släpp fram appen igen. Bekräftelsen visas
      // som toast eftersom sidan byts ut i samma ögonblick.
      toast.success(t('auth.passwordUpdated'))
      endPasswordRecovery()
    } catch (err) {
      setError(unexpected(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    // Ingen dubbelklick och ingen kvarhängande grön notis ovanför ett rött fel.
    if (busy) return
    setError(null)
    setNotice(null)
    setGoogleLoading(true)
    try {
      const redirectTo = authRedirectUrl()
      const native = isNativeApp()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          // I native får auth-js INTE navigera själv: den skulle skicka appens
          // egen WebView till Google, som blockerar OAuth i inbäddade vyer
          // ("Something went wrong, sign in another way"). Vi tar URL:en och
          // öppnar den i systemets webbläsare i stället.
          ...(native ? { skipBrowserRedirect: true } : {}),
        },
      })
      // Lyckas anropet på WEBBEN sätter auth-js window.location och löser ut
      // direkt — sidan står kvar synlig medan navigeringen sker. Släpp därför
      // INTE knappen på success-vägen, annars går det att starta en andra resa.
      if (error) {
        setError(translateAuthError(error.message, t))
        setGoogleLoading(false)
        return
      }
      if (native) {
        if (!data?.url) {
          setError(t('auth.err.googleFailed'))
          setGoogleLoading(false)
          return
        }
        await openExternalAuth(data.url)
        // Användaren kan stänga fliken utan att logga in — då kommer ingen deep
        // link och knappen måste bli klickbar igen.
        setGoogleLoading(false)
      }
    } catch (err) {
      setError(unexpected(err))
      setGoogleLoading(false)
    }
  }

  /** Gemensam nollställning vid lägesbyte: fel, notiser, skickat och lösenord. */
  function resetFormState() {
    setError(null)
    setNotice(null)
    setSent(false)
    // autoComplete växlar mellan new-password och current-password — ett kvarglömt
    // lösenord i fältet hör inte hemma i det nya läget.
    setPassword('')
  }

  return (
    <div className="min-h-screen safe-pt flex flex-col" style={{
      backgroundImage: `url('/image-1780947666657.webp')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />

      {/* Main content */}
      <div className="relative flex flex-1 z-10 items-center justify-center gap-16 py-10 px-6 flex-col lg:flex-row lg:px-12">
        {/* Left — logo + text — dölj på mobil */}
        <div className="hidden lg:flex flex-col justify-between" style={{ width: '380px' }}>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FormPlan" style={{ height: '160px', width: 'auto' }} />
          </div>

          {/* Hero text */}
          <div className="mb-16">
            <h1 className="font-extrabold leading-tight mb-4" style={{ fontSize: '44px' }}>
              <span style={{ color: 'var(--brand)' }}>{t('auth.tagline')}</span>{' '}
              <span className="text-white">{t('auth.heroTitle')}</span>
            </h1>
            <p className="text-slate-300 text-base leading-relaxed max-w-sm">
              {t('auth.heroSub')}
            </p>
          </div>
        </div>

        {/* Right — login card */}
        <div className="w-full max-w-[480px] px-6 py-8 lg:w-[580px] lg:max-w-none lg:p-10 lg:flex lg:items-center lg:justify-center" style={{
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 60px var(--brand-glow), 0 0 120px rgba(34, 230, 198, 0.08), 0 25px 50px rgba(0,0,0,0.5)',
          borderRadius: '20px',
          flexShrink: 0,
        }}>
          <div className="w-full lg:max-w-[380px]">
            <div>
              <div className="lg:max-w-[380px] lg:mx-auto">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <img src="/logo.png" alt="FormPlan" style={{ height: '210px', width: 'auto' }} />
              </div>

              {verifyingLink ? (
                /* Markören finns i adressen men länken är inte verifierad ännu.
                   Visa ingenting som kan ändra lösenordet förrän den är det. */
                <div className="text-center py-6">
                  <div className="w-8 h-8 mx-auto mb-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <p className="text-slate-300 text-sm">{t('auth.verifyingReset')}</p>
                </div>
              ) : recovering ? (
                /* Tillbaka via återställningslänken — sätt ett nytt lösenord. */
                <form onSubmit={handleSetNewPassword} className="space-y-3">
                  <h2 className="text-white text-2xl font-bold text-center mb-1">{t('auth.newPassword')}</h2>
                  <p className="text-slate-400 text-sm text-center mb-7">
                    {t('auth.newPasswordSub')}
                  </p>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('auth.newPasswordPlaceholder', { min: MIN_PASSWORD_LENGTH })} required
                      minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" autoFocus
                      className="w-full pl-11 pr-4 py-4 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:outline-[var(--brand)] transition-all"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                  </div>
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                  <button type="submit" disabled={busy}
                    className="w-full flex items-center justify-center px-5 py-4 rounded-xl text-sm font-semibold text-slate-900 transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)' }}>
                    {loading ? t('auth.saving') : t('auth.saveNewPassword')}
                  </button>
                  <p className="text-center text-xs text-slate-400 pt-1">
                    <button type="button"
                      onClick={() => { endPasswordRecovery(); setNewPassword(''); resetFormState() }}
                      className="font-semibold" style={{ color: 'var(--brand)' }}>
                      {t('auth.cancel')}
                    </button>
                  </p>
                </form>
              ) : (
                <>
                  <h2 className="text-white text-2xl font-bold text-center mb-1">
                    {isSignup ? t('auth.createAccount') : t('auth.welcomeBack')}
                  </h2>
                  <p className="text-slate-400 text-sm text-center mb-7">
                    {isSignup ? t('auth.createAccountSub') : t('auth.signInSub')}
                  </p>

                  {/* Googles MÖRKA knappvariant (#131314 + vit text), inte den
                      ljusa. Knappen var bg-white text-slate-900, men
                      index.css har `html.dark .bg-white { bg-stone-800 }` för
                      appens kort — och den regeln träffade även den här sidan,
                      som är mörk med flit och inte deltar i temat. Resultatet
                      blev mörk text på mörk knapp i mörkt läge, vilket är
                      standardläget. Den hårdkodade färgen ligger utanför
                      regelns räckvidd. */}
                  <button onClick={handleGoogle} disabled={busy}
                    className="w-full flex items-center justify-center gap-3 bg-[#131314] text-white border border-white/25 font-semibold py-4 rounded-xl mb-5 hover:bg-[#1f1f20] transition-colors text-sm disabled:opacity-60">
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {googleLoading ? t('auth.openingGoogle') : t('auth.continueWithGoogle')}
                  </button>

                  <div className="relative mb-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 text-slate-500" style={{ background: 'transparent' }}>{t('auth.or')}</span>
                    </div>
                  </div>

                  {/* Metodväljare: lösenord eller magisk länk */}
                  <div className="flex gap-1 p-1 mb-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {(['password', 'magic'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setMode(m); resetFormState() }}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
                        style={mode === m ? { background: 'var(--brand)', color: '#0f172a' } : { color: '#cbd5e1' }}
                      >
                        {t(m === 'password' ? 'auth.tabPassword' : 'auth.tabMagicLink')}
                      </button>
                    ))}
                  </div>

                  {mode === 'password' ? (
                    <form onSubmit={handlePassword} className="space-y-3">
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                        </div>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          placeholder={t('auth.emailPlaceholder')} required autoComplete="email"
                          className="w-full pl-11 pr-4 py-4 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:outline-[var(--brand)] transition-all"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('auth.passwordWithMin', { min: MIN_PASSWORD_LENGTH })} required
                          minLength={MIN_PASSWORD_LENGTH}
                          autoComplete={isSignup ? 'new-password' : 'current-password'}
                          className="w-full pl-11 pr-4 py-4 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:outline-[var(--brand)] transition-all"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                        />
                      </div>
                      {!isSignup && (
                        <p className="text-right">
                          <button type="button" onClick={handleForgotPassword} disabled={busy}
                            className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-60 underline">
                            {t('auth.forgotPassword')}
                          </button>
                        </p>
                      )}
                      {error && <p className="text-red-400 text-xs">{error}</p>}
                      {notice && <p className="text-emerald-400 text-xs">{notice}</p>}
                      <button type="submit" disabled={busy}
                        className="w-full flex items-center justify-center px-5 py-4 rounded-xl text-sm font-semibold text-slate-900 transition-all disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)' }}>
                        {loading ? (isSignup ? t('auth.creatingAccount') : t('auth.signingIn')) : (isSignup ? t('auth.createAccount') : t('auth.signIn'))}
                      </button>
                      <p className="text-center text-xs text-slate-400 pt-1">
                        {isSignup ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
                        <button type="button"
                          onClick={() => { setIsSignup(!isSignup); resetFormState() }}
                          className="font-semibold" style={{ color: 'var(--brand)' }}>
                          {isSignup ? t('auth.signIn') : t('auth.createAccount')}
                        </button>
                      </p>
                    </form>
                  ) : sent ? (
                    /* "Länk skickad" hör hemma i magisk länk-läget — tidigare
                       låstes hela kortet (även lägesväljaren) tills sidan
                       laddades om. */
                    <div className="text-center py-2">
                      <p className="text-white font-semibold text-lg mb-2">{t('auth.checkYourMail')}</p>
                      <p className="text-slate-400 text-sm">{t('auth.sentLinkToEmail', { email })}</p>
                      <button type="button"
                        onClick={() => { setSent(false); setEmail(''); setError(null); setNotice(null) }}
                        className="mt-4 text-xs font-semibold" style={{ color: 'var(--brand)' }}>
                        {t('auth.useAnotherAddress')}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleMagicLink} className="space-y-3">
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                        </div>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          placeholder={t('auth.emailPlaceholder')} required autoComplete="email"
                          className="w-full pl-11 pr-4 py-4 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:outline-[var(--brand)] transition-all"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                        />
                      </div>
                      {error && <p className="text-red-400 text-xs">{error}</p>}
                      {notice && <p className="text-emerald-400 text-xs">{notice}</p>}
                      <button type="submit" disabled={busy}
                        className="w-full flex items-center justify-between px-5 py-4 rounded-xl text-sm font-semibold text-slate-900 transition-all disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)' }}>
                        <span>{loading ? t('auth.sending') : t('auth.sendMagicLink')}</span>
                        {!loading && (
                          <svg className="w-4 h-4 stroke-slate-900" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                        )}
                      </button>
                    </form>
                  )}

                  <div className="flex items-center justify-center gap-2 mt-5 text-slate-500 text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    {t('auth.secureNotice')}
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom feature bar */}
      <div className="relative z-10 border-t px-6 py-5 hidden sm:block lg:px-10" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)' }}>
        <div className="flex items-start justify-between gap-4 lg:gap-6 max-w-5xl mx-auto overflow-x-auto lg:overflow-visible">
          {[
            { d: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z', title: t('landing.savesTime'), desc: t('landing.savesTimeDesc') },
            { d: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: t('landing.personal'), desc: t('landing.personalDesc') },
            { d: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941', title: t('landing.research'), desc: t('landing.researchDesc') },
            { d: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z', title: t('landing.secure'), desc: t('landing.secureDesc') },
            { d: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z', title: t('landing.results'), desc: t('landing.resultsDesc') },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 flex-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'var(--brand-dim)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="var(--brand)">
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
