import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=5&geo=europe')
    const data = await res.json()
    return Response.json({
      status: res.status,
      count: data?.jobs?.length ?? 0,
      first_title: data?.jobs?.[0]?.jobTitle ?? 'none',
    })
  } catch (err) {
    return Response.json({ error: String(err) })
  }
}