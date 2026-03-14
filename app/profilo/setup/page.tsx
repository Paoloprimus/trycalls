'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const EU_COUNTRIES = [
  { code: 'IT', label: 'Italia' },
  { code: 'DE', label: 'Germania' },
  { code: 'FR', label: 'Francia' },
  { code: 'ES', label: 'Spagna' },
  { code: 'PL', label: 'Polonia' },
  { code: 'NL', label: 'Paesi Bassi' },
  { code: 'BE', label: 'Belgio' },
  { code: 'PT', label: 'Portogallo' },
  { code: 'SE', label: 'Svezia' },
  { code: 'AT', label: 'Austria' },
  { code: 'DK', label: 'Danimarca' },
  { code: 'FI', label: 'Finlandia' },
  { code: 'IE', label: 'Irlanda' },
  { code: 'GR', label: 'Grecia' },
  { code: 'CZ', label: 'Repubblica Ceca' },
  { code: 'RO', label: 'Romania' },
  { code: 'HU', label: 'Ungheria' },
  { code: 'SK', label: 'Slovacchia' },
  { code: 'HR', label: 'Croazia' },
  { code: 'BG', label: 'Bulgaria' },
  { code: 'NO', label: 'Norvegia' },
  { code: 'CH', label: 'Svizzera' },
  { code: 'GB', label: 'Regno Unito' },
]

const AREAS = [
  { value: 'ricerca', label: 'Ricerca scientifica' },
  { value: 'arte', label: 'Arte e cultura' },
  { value: 'impresa', label: 'Impresa e innovazione' },
  { value: 'sociale', label: 'Sociale e volontariato' },
  { value: 'ambiente', label: 'Ambiente' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'altro', label: 'Altro' },
]

const LANGUAGES = [
  { value: 'it', label: 'Italiano' },
  { value: 'en', label: 'Inglese' },
  { value: 'fr', label: 'Francese' },
  { value: 'de', label: 'Tedesco' },
  { value: 'es', label: 'Spagnolo' },
  { value: 'other', label: 'Altro' },
]

export default function ProfileSetupPage() {
  const router = useRouter()
  const [country, setCountry] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [studyLevel, setStudyLevel] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [notifyDays, setNotifyDays] = useState(30)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleArray(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  async function handleSubmit() {
    setError('')
    if (!country || !ageRange || !studyLevel || areas.length === 0 || languages.length === 0) {
      setError('Compila tutti i campi per continuare.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      country,
      age_range: ageRange,
      study_level: studyLevel,
      areas,
      languages,
      notify_days_before: notifyDays,
    })

    if (error) {
      setError('Errore nel salvataggio. Riprova.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  const labelClass = "block text-sm font-medium text-gray-700 mb-2"
  const sectionClass = "space-y-2"
  const chipBase = "px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors"
  const chipActive = "text-white border-transparent"
  const chipInactive = "bg-white text-gray-600 border-gray-200 hover:border-blue-300"

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#1E3A5F' }}>Il tuo profilo</h1>
        <p className="text-sm text-gray-500 mb-8">Ci servono poche informazioni per trovarti le opportunità giuste.</p>

        <div className="space-y-6">

          {/* Paese */}
          <div className={sectionClass}>
            <label className={labelClass}>Paese</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
            >
              <option value="">Seleziona paese</option>
              {EU_COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Fascia d'età */}
          <div className={sectionClass}>
            <label className={labelClass}>Fascia d&apos;età</label>
            <div className="flex flex-wrap gap-2">
              {['18-25', '26-30', '31-35', '36+'].map(r => (
                <button
                  key={r}
                  onClick={() => setAgeRange(r)}
                  className={`${chipBase} ${ageRange === r ? chipActive : chipInactive}`}
                  style={ageRange === r ? { backgroundColor: '#2E86C1' } : {}}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Livello di studio */}
          <div className={sectionClass}>
            <label className={labelClass}>Livello di studio</label>
            <select
              value={studyLevel}
              onChange={e => setStudyLevel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
            >
              <option value="">Seleziona livello</option>
              <option value="triennale">Triennale</option>
              <option value="magistrale">Magistrale</option>
              <option value="dottorato">Dottorato</option>
              <option value="post-doc">Post-doc</option>
              <option value="altro">Altro</option>
            </select>
          </div>

          {/* Aree */}
          <div className={sectionClass}>
            <label className={labelClass}>Aree di interesse <span className="text-gray-400">(anche più di una)</span></label>
            <div className="flex flex-wrap gap-2">
              {AREAS.map(a => (
                <button
                  key={a.value}
                  onClick={() => toggleArray(areas, a.value, setAreas)}
                  className={`${chipBase} ${areas.includes(a.value) ? chipActive : chipInactive}`}
                  style={areas.includes(a.value) ? { backgroundColor: '#2E86C1' } : {}}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lingue */}
          <div className={sectionClass}>
            <label className={labelClass}>Lingue conosciute</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  onClick={() => toggleArray(languages, l.value, setLanguages)}
                  className={`${chipBase} ${languages.includes(l.value) ? chipActive : chipInactive}`}
                  style={languages.includes(l.value) ? { backgroundColor: '#2E86C1' } : {}}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Anticipo notifica */}
          <div className={sectionClass}>
            <label className={labelClass}>
              Avvisami <span className="font-semibold" style={{ color: '#2E86C1' }}>{notifyDays} giorni</span> prima della scadenza
            </label>
            <input
              type="range"
              min={14}
              max={90}
              step={1}
              value={notifyDays}
              onChange={e => setNotifyDays(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>14 giorni</span>
              <span>90 giorni</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#1E3A5F' }}
          >
            {loading ? 'Salvataggio...' : 'Salva e continua'}
          </button>
        </div>
      </div>
    </div>
  )
}