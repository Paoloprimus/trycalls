import { createClient } from '@/lib/supabase/server'
import { matchOpportunities, daysUntil, type Opportunity, type Profile } from '@/lib/matching'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const days = daysUntil(deadline)
  if (days === null) return null

  const color = days < 14
    ? 'bg-red-100 text-red-700'
    : days < 30
    ? 'bg-orange-100 text-orange-700'
    : 'bg-green-100 text-green-700'

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>
      {days === 0 ? 'Scade oggi' : `Scade tra ${days} giorni`}
    </span>
  )
}

function OpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
          {opp.title}
        </h2>
        <DeadlineBadge deadline={opp.deadline} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
          {opp.source}
        </span>
        {opp.areas.slice(0, 2).map(a => (
          <span key={a} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            {a}
          </span>
        ))}
      </div>

      {opp.description_short_it && (
        <p className="text-sm text-gray-500 line-clamp-2">
          {opp.description_short_it}
        </p>
      )}

      
        href={opp.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm font-medium px-4 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#2E86C1' }}
      >
        Scopri di più →
      </a>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/profilo/setup')

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, source, title, url, deadline, countries, areas, study_levels, description_short_it, funding_amount')
    .eq('is_active', true)
    .limit(200)

  const matched = matchOpportunities(
    profile as Profile,
    (opportunities ?? []) as Opportunity[]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#1E3A5F' }}>
          {matched.length > 0
            ? `${matched.length} opportunità per te`
            : 'Nessuna opportunità trovata'}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Ordinate per scadenza · aggiornate ogni giorno
        </p>
      </div>

      {matched.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center space-y-3">
          <p className="text-gray-500 text-sm">
            Nessuna opportunità corrisponde al tuo profilo attuale.
          </p>
          <Link
            href="/profilo/setup"
            className="text-sm font-medium"
            style={{ color: '#2E86C1' }}
          >
            Modifica le tue preferenze →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {matched.map(opp => (
          <OpportunityCard key={opp.id} opp={opp} />
        ))}
      </div>
    </div>
  )
}