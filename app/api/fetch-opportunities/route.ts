import { createClient } from '@supabase/supabase-js'
import { fetchCordisOpportunities } from '@/lib/fetchers/cordis'

export const maxDuration = 30

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results = await Promise.allSettled([
    fetchCordisOpportunities(),
  ])

  let inserted = 0
  let updated = 0
  let errors: string[] = []

  for (const result of results) {
    if (result.status === 'rejected') {
      errors.push(String(result.reason))
      continue
    }
    for (const opp of result.value) {
      if (!opp.external_id) continue
      const { error } = await supabase
        .from('opportunities')
        .upsert(opp, { onConflict: 'external_id' })
      if (error) {
        errors.push(error.message)
      } else {
        inserted++
      }
    }
  }

  // Disattiva opportunità scadute
  await supabase
    .from('opportunities')
    .update({ is_active: false })
    .lt('deadline', new Date().toISOString().split('T')[0])
    .eq('is_active', true)

  return Response.json({
    inserted,
    updated,
    deactivated: 0,
    errors,
  })

  return Response.json({
    inserted,
    updated,
    deactivated: 0,
    errors,
  })
}