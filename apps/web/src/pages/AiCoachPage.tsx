import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, SendIcon, BotIcon } from '../components/ui/Icons'
import { getLocalSessions } from '../lib/workoutSessionStore'
import { getWeightEntries } from '../lib/weightStore'
import { getTrainingStreak } from '../lib/streakStore'
import { request, ApiError } from '../lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Hur lång vila behöver jag mellan passen?',
  'Vad ska jag äta innan träning?',
  'Hur vet jag om jag tränar för hårt?',
  'Tips för att bli starkare i bänkpress',
  'Hur bryter jag en platå?',
]

function buildContext(): string {
  const sessions = getLocalSessions().slice(0, 5)
  const weights = getWeightEntries().slice(-3)
  const streak = getTrainingStreak()
  const lines: string[] = []
  if (streak > 0) lines.push(`Träningsstreak: ${streak} dagar`)
  if (sessions.length > 0) {
    lines.push(`Senaste ${sessions.length} pass: ${sessions.map((s) => s.workout_name).join(', ')}`)
    const avgDuration = Math.round(sessions.reduce((s, x) => s + x.duration_seconds, 0) / sessions.length / 60)
    lines.push(`Snittlängd per pass: ${avgDuration} min`)
  }
  if (weights.length > 0) {
    lines.push(`Senaste vikt: ${weights[weights.length - 1]?.weight_kg?.toFixed(1)} kg`)
  }
  return lines.join('\n')
}

async function askCoach(messages: Message[]): Promise<string> {
  try {
    const { reply } = await request<{ reply: string }>('/ai/coach', {
      method: 'POST',
      body: JSON.stringify({ messages, context: buildContext() }),
    })
    return reply
  } catch (e) {
    // Premium-gate: don't fake an answer — the central toast already fired, so
    // tell the user to upgrade.
    if (e instanceof ApiError && e.status === 402) {
      return 'AI-coachen är en Premium-funktion. Uppgradera under Mer → Premium för att fortsätta chatta.'
    }
    // Fallback: simple rule-based responses if backend endpoint doesn't exist
    const lastMsg = messages[messages.length - 1]?.content.toLowerCase() ?? ''
    if (lastMsg.includes('vila') || lastMsg.includes('rest')) {
      return 'Generellt rekommenderas 48 timmar vila för samma muskelgrupp. Lyssna på din kropp — känner du dig fortfarande trött och öm, ta en extra vilodag. Aktiv återhämtning som promenader eller stretching kan hjälpa.'
    }
    if (lastMsg.includes('äta') || lastMsg.includes('mat') || lastMsg.includes('kost')) {
      return 'Ät ett kolhydratrikt mellanmål 1–2 timmar innan träning, t.ex. havregryn eller banan. Protein är viktigt efter passet för muskelåterhämtning — sikta på 20–40g protein inom 2 timmar efter träning.'
    }
    if (lastMsg.includes('platå') || lastMsg.includes('fastnat') || lastMsg.includes('starkare')) {
      return 'Platåer är normala! Prova periodisering: variera rep-intervall (t.ex. 3×5 en vecka, 4×8 nästa). Kontrollera att du sover tillräckligt (7–9 h), äter tillräckligt protein, och progressivt ökar belastningen. Ibland hjälper det med en deload-vecka med lägre vikt.'
    }
    if (lastMsg.includes('för hårt') || lastMsg.includes('överträning')) {
      return 'Tecken på överträning: kronisk trötthet, minskad prestanda, humörsvängningar, sömnproblem och ökad skaderisk. Lösning: 1–2 veckors deload, prioritera sömn och kost. En bra tumregel: om du inte kan träna med samma entusiasm som vanligt, ta en extra vilodag.'
    }
    return 'Jag förstår din fråga! Tyvärr kan jag inte ge ett specifikt svar just nu, men generellt gäller: träna progressivt, återhämta dig ordentligt, ät varierat och lyssna på din kropp. Har du en mer specifik fråga om träning eller kost?'
  }
}

export function AiCoachPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hej! Jag är din AI-coach på FormPlan. Jag kan hjälpa dig med träningsfrågor, kosttips och återhämtning.\n\n${buildContext() ? `Jag ser att du har tränat nyligen — bra jobbat! ` : ''}Vad vill du veta?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const reply = await askCoach(newMessages)
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Något gick fel. Försök igen.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-canvas max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-header pb-4 bg-white border-b border-stone-100 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100">
          <ChevronLeftIcon className="w-5 h-5 stroke-stone-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center">
            <BotIcon className="w-4 h-4 stroke-forest-600" />
          </div>
          <div>
            <p className="font-semibold text-stone-900">AI-coach</p>
            <p className="text-[10px] text-forest-600">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-forest-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                <BotIcon className="w-3.5 h-3.5 stroke-forest-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-forest-700 text-white rounded-tr-sm'
                  : 'bg-white border border-stone-100 text-stone-800 rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-forest-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
              <BotIcon className="w-3.5 h-3.5 stroke-forest-600" />
            </div>
            <div className="bg-white border border-stone-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Suggestions (only at start) */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs bg-white border border-stone-200 rounded-full px-3 py-1.5 text-stone-600 hover:border-forest-300 hover:text-forest-700 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-5 pb-6 pt-3 bg-white border-t border-stone-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ställ en träningsfråga..."
            className="flex-1 bg-stone-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-forest-700 rounded-2xl flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            <SendIcon className="w-4 h-4 stroke-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
