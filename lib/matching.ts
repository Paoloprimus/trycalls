export type Profile = {
  id: string
  country: string | null
  age_range: string | null
  study_level: string | null
  areas: string[] | null
  languages: string[] | null
  notify_days_before: number | null
}

export type Opportunity = {
  id: string
  source: string
  title: string
  url: string
  deadline: string | null
  countries: string[]
  areas: string[]
  study_levels: string[]
  description_short_it: string | null
  funding_amount: string | null
}

export function matchOpportunities(
  profile: Profile,
  opportunities: Opportunity[]
): Opportunity[] {
  const today = new Date()
  const notifyDays = profile.notify_days_before ?? 30

  return opportunities
    .filter(opp => {
      // Deve avere deadline futura entro notify_days_before
      if (opp.deadline) {
        const deadline = new Date(opp.deadline)
        const daysUntil = Math.ceil(
          (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysUntil < 0 || daysUntil > notifyDays) return false
      }

      // Paese: match se countries vuoto o include il paese utente
      if (profile.country && opp.countries.length > 0) {
        if (!opp.countries.includes(profile.country)) return false
      }

      // Livello studio: match se study_levels vuoto o include il livello utente
      if (profile.study_level && opp.study_levels.length > 0) {
        if (!opp.study_levels.includes(profile.study_level)) return false
      }

      // Aree: match se areas vuoto o almeno una area in comune
      if (profile.areas && profile.areas.length > 0 && opp.areas.length > 0) {
        const hasMatch = profile.areas.some(a => opp.areas.includes(a))
        if (!hasMatch) return false
      }

      return true
    })
    .sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })
}

export function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null
  const today = new Date()
  const d = new Date(deadline)
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}