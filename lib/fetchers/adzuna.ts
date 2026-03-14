import type { OpportunityInsert } from './cordis'

export async function fetchAdzunaJobs(): Promise<OpportunityInsert[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const countries = ['it', 'de', 'fr', 'gb', 'es', 'nl', 'pl']
    const allJobs: OpportunityInsert[] = []

    for (const country of countries) {
      const params = new URLSearchParams({
        app_id: process.env.ADZUNA_APP_ID!,
        app_key: process.env.ADZUNA_APP_KEY!,
        results_per_page: '20',
        what: 'graduate OR junior OR trainee OR internship OR erasmus OR fellowship',
        sort_by: 'date',
      })

      const res = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`,
        { signal: controller.signal }
      )

      if (!res.ok) continue

      const data = await res.json()
      const results = data?.results ?? []

      for (const job of results) {
        const deadline = new Date()
        deadline.setDate(deadline.getDate() + 30)
        const deadlineStr = deadline.toISOString().split('T')[0]

        allJobs.push({
          source: 'adzuna',
          external_id: `adzuna-${job.id}`,
          title: String(job.title ?? ''),
          url: job.redirect_url ?? `https://www.adzuna.com/jobs/details/${job.id}`,
          deadline: deadlineStr,
          countries: [country.toUpperCase()],
          areas: mapJobAreas(job.title ?? '', job.description ?? ''),
          study_levels: mapStudyLevels(job.title ?? '', job.description ?? ''),
          funding_amount: job.salary_min ? String(job.salary_min) : null,
          is_active: true,
          raw: job,
        })
      }
    }

    clearTimeout(timeout)
    return allJobs

  } catch (err) {
    console.error('Adzuna fetch error:', err)
    return []
  }
}

function mapJobAreas(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase()
  const areas = new Set<string>()
  if (text.match(/research|science|phd|dottorat/)) areas.add('ricerca')
  if (text.match(/tech|software|developer|digital|ai|data/)) areas.add('tecnologia')
  if (text.match(/art|design|creative|cultura|music/)) areas.add('arte')
  if (text.match(/social|ngo|nonprofit|volontari/)) areas.add('sociale')
  if (text.match(/environment|green|climate|energia/)) areas.add('ambiente')
  if (text.match(/business|marketing|finance|sales|impresa/)) areas.add('impresa')
  return areas.size > 0 ? Array.from(areas) : ['altro']
}

function mapStudyLevels(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase()
  const levels = new Set<string>()
  if (text.match(/phd|dottorat|post.?doc/)) levels.add('dottorato')
  if (text.match(/master|magistral|graduate/)) levels.add('magistrale')
  if (text.match(/bachelor|triennal|undergraduate/)) levels.add('triennale')
  if (text.match(/junior|entry.?level|trainee|intern/)) {
    levels.add('triennale')
    levels.add('magistrale')
  }
  return levels.size > 0 ? Array.from(levels) : []
}