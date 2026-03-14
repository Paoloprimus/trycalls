import { createClient } from '@supabase/supabase-js'
import { fetchTheMuseJobs } from '@/lib/fetchers/themuse'

export const maxDuration = 60

export async function POST(request: Request) {
  
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let inserted = 0
  let errors: string[] = []

  try {
    const opportunities = await fetchTheMuseJobs()

    if (opportunities.length > 0) {
      const { error } = await supabase
        .from('opportunities')
        .upsert(opportunities, { onConflict: 'external_id' })

      if (error) {
        errors.push(error.message)
      } else {
        inserted = opportunities.length
      }
    }

    await supabase
      .from('opportunities')
      .update({ is_active: false })
      .lt('deadline', new Date().toISOString().split('T')[0])
      .eq('is_active', true)

  } catch (err) {
    errors.push(String(err))
  }

  return Response.json({ inserted, errors })
}