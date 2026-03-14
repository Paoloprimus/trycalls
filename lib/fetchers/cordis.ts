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

const MONTHS: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3,
  May: 4, June: 5, July: 6, August: 7,
  September: 8, October: 9, November: 10, December: 11,
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

function parseDeadlineDates(metadata: Record<string, unknown>): Date[] {
  try {
    const deadlineRaw = Array.isArray(metadata.deadlineDate)
      ? metadata.deadlineDate[0]
      : null
    if (!deadlineRaw) return []
    const parsed = JSON.parse(String(deadlineRaw))
    const dates: string[] = parsed[0]?.deadlineDates ?? []
    return dates.flatMap(d => {
      const parts = d.split(' ')
      if (parts.length === 3) {
        const month = MONTHS[parts[1]]
        if (month !== undefined) {
          return [new Date(Number(parts[2]), month, Number(parts[0]))]
        }
      }
      return []
    })
  } catch {}
  return []
}

function isOpen(metadata: Record<string, unknown>): boolean {
  const today = new Date()
  const dates = parseDeadlineDates(metadata)
  return dates.some(d => d > today)
}

function extractDeadline(metadata: Record<string, unknown>): string | null {
  const today = new Date()
  const dates = parseDeadlineDates(metadata)
  const future = dates.filter(d => d > today).sort((a, b) => a.getTime() - b.getTime())
  if (future.length === 0) return null
  const d = future[0]
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
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
      sortBy: 'sortStatus',
      orderBy: 'asc',
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
      .filter(r => {
        if (!r.reference || !r.summary) return false
        const meta = (r.metadata ?? {}) as Record<string, unknown>
        return isOpen(meta)
      })
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