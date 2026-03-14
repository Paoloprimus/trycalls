export type OpportunityInsert = {
  source: string
  external_id: string
  title: string
  url: string
  deadline: string | null
  countries: string[]
  areas: string[]
  study_levels: string[]
  funding_amount: string | null
  is_active: boolean
  raw: unknown
}

const AREA_MAP: Record<string, string> = {
  'health': 'ricerca',
  'bio': 'ricerca',
  'medical': 'ricerca',
  'digital': 'tecnologia',
  'ict': 'tecnologia',
  'ai': 'tecnologia',
  'energy': 'ambiente',
  'climate': 'ambiente',
  'environment': 'ambiente',
  'culture': 'arte',
  'creative': 'arte',
  'social': 'sociale',
  'innovation': 'impresa',
  'sme': 'impresa',
  'enterprise': 'impresa',
}

function mapAreas(topics: string[]): string[] {
  if (!topics || topics.length === 0) return []
  const mapped = new Set<string>()
  for (const topic of topics) {
    const lower = topic.toLowerCase()
    for (const [key, area] of Object.entries(AREA_MAP)) {
      if (lower.includes(key)) mapped.add(area)
    }
  }
  return mapped.size > 0 ? Array.from(mapped) : []
}

export async function fetchCordisOpportunities(): Promise<OpportunityInsert[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(
      'https://cordis.europa.eu/api/search?query=&status=open&format=json&pageSize=100',
      { signal: controller.signal }
    )
    clearTimeout(timeout)

    if (!res.ok) {
      console.error(`CORDIS HTTP error: ${res.status}`)
      return []
    }

    const data = await res.json()
    const records = data?.results ?? data?.payload?.results ?? []

    if (!Array.isArray(records)) {
      console.error('CORDIS: unexpected response shape', JSON.stringify(data).slice(0, 200))
      return []
    }

    return records.map((r: Record<string, unknown>) => ({
      source: 'cordis',
      external_id: String(r.id ?? r.rcn ?? ''),
      title: String(r.title ?? r.acronym ?? 'Untitled'),
      url: `https://cordis.europa.eu/project/id/${r.id}`,
      deadline: r.endDate ? String(r.endDate) : null,
      countries: Array.isArray(r.countries) ? r.countries.map(String) : [],
      areas: mapAreas(Array.isArray(r.topics) ? r.topics.map(String) : []),
      study_levels: [],
      funding_amount: r.totalCost ? String(r.totalCost) : null,
      is_active: true,
      raw: r,
    }))

  } catch (err) {
    console.error('CORDIS fetch error:', err)
    return []
  }
}