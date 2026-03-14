import type { OpportunityInsert } from './cordis'

export async function fetchTheMuseJobs(): Promise<OpportunityInsert[]> {
  const allJobs: OpportunityInsert[] = []

  try {
    const pages = [1, 2, 3]

    for (const page of pages) {
      const params = new URLSearchParams({
        page: String(page),
        level: 'Entry Level',
        category: 'Computer and IT,Data and Analytics,Engineering,Science and Research,Social Media and Community',
      })

      const res = await fetch(
        `https://www.themuse.com/api/public/jobs?${params}`,
        { signal: AbortSignal.timeout(10000) }
      )

      if (!res.ok) {
        console.error(`TheMuse page ${page}: status=${res.status}`)
        break
      }

      const data = await res.json()
      console.log(`TheMuse page ${page}: results=${data?.results?.length ?? 0}`)
      const results = data?.results ?? []

      for (const job of results) {
        const deadline = new Date()
        deadline.setDate(deadline.getDate() + 30)
        const deadlineStr = deadline.toISOString().split('T')[0]

        const locations: string[] = (job.locations ?? []).map((l: { name: string }) => l.name)
        const countries = mapLocationsToCountries(locations)

        allJobs.push({
          source: 'themuse',
          external_id: `themuse-${job.id}`,
          title: String(job.name ?? ''),
          url: job.refs?.landing_page ?? `https://www.themuse.com/jobs/${job.id}`,
          deadline: deadlineStr,
          countries,
          areas: mapJobAreas(job.name ?? '', job.categories ?? []),
          study_levels: ['triennale', 'magistrale'],
          funding_amount: null,
          is_active: true,
          raw: job,
        })
      }
    }
  } catch (err) {
    console.error('TheMuse fetch error:', err)
  }

  console.log(`TheMuse total jobs collected: ${allJobs.length}`)
  return allJobs
}

function mapLocationsToCountries(locations: string[]): string[] {
  const map: Record<string, string> = {
    'Italy': 'IT', 'Germany': 'DE', 'France': 'FR',
    'Spain': 'ES', 'Netherlands': 'NL', 'Poland': 'PL',
    'United Kingdom': 'GB', 'Remote': 'IT',
  }
  const countries = new Set<string>()
  for (const loc of locations) {
    for (const [key, code] of Object.entries(map)) {
      if (loc.includes(key)) countries.add(code)
    }
  }
  return countries.size > 0 ? Array.from(countries) : []
}

function mapJobAreas(title: string, categories: { name: string }[]): string[] {
  const text = `${title} ${categories.map(c => c.name).join(' ')}`.toLowerCase()
  const areas = new Set<string>()
  if (text.match(/research|science|data/)) areas.add('ricerca')
  if (text.match(/tech|software|engineer|computer|it|digital/)) areas.add('tecnologia')
  if (text.match(/social|community|ngo/)) areas.add('sociale')
  if (text.match(/environment|green|climate/)) areas.add('ambiente')
  if (text.match(/business|marketing|finance|sales/)) areas.add('impresa')
  return areas.size > 0 ? Array.from(areas) : ['altro']
}