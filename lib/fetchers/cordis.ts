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

function mapAreas(keywords: string[]): string[] {
  if (!keywords || keywords.length === 0) return []
  const mapped = new Set<string>()
  for (const kw of keywords) {
    const lower = kw.toLowerCase()
    for (const [key, area] of Object.entries(AREA_MAP)) {
      if (lower.includes(key)) mapped.add(area)
    }
  }
  return mapped.size > 0 ? Array.from(mapped) : []
}

function extractDeadline(metadata: Record<string, unknown>): string | null {
  try {
    const sortDate = metadata?.es_SortDate
    if (Array.isArray(sortDate) && sortDate[0]) {
      return String(sortDate[0]).split('T')[0]
    }
  } catch {}
  return null
}

function extractUrl(result: Record<string, unknown>): string {
  const url = result.url
  if (typeof url === 'string' && url.startsWith('http')) return url
  return `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${result.reference}`
}

export async function fetchCordisOpportunities(): Promise<OpportunityInsert[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const params = new URLSearchParams({
      apiKey: 'SEDIA',
      text: '***',
      pageSize: '100',
      pageNumber: '1',
      action: 'SEARCH',
      CFP_STATUS: '31094501', // open calls
    })

    const res = await fetch(
      `https://api.tech.ec.europa.eu/search-api/prod/rest/search?${params}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: controller.signal,
      }
    )
    clearTimeout(timeout)

    if (!res.ok) {
      console.error(`EU Funding API error: ${res.status}`)
      return []
    }

    const data = await res.json()
    const results: Record<string, unknown>[] = data?.results ?? []

    if (!Array.isArray(results)) {
      console.error('EU Funding API: unexpected shape')
      return []
    }

    return results
      .filter(r => r.reference && r.summary)
      .map(r => {
        const meta = (r.metadata ?? {}) as Record<string, unknown>
        const keywords = Array.isArray(meta.keywords)
          ? meta.keywords.map(String)
          : []

        return {
          source: 'eu-funding',
          external_id: String(r.reference),
          title: String(r.summary ?? r.content ?? 'Untitled'),
          url: extractUrl(r),
          deadline: extractDeadline(meta),
          countries: [],
          areas: mapAreas(keywords),
          study_levels: [],
          funding_amount: null,
          is_active: true,
          raw: r,
        }
      })

  } catch (err) {
    console.error('EU Funding fetch error:', err)
    return []
  }
}