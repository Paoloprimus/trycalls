import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=5')
    const data = await res.json()
    return Response.json({
      status: res.status,
      count: data?.jobs?.length ?? 0,
      first_title: data?.jobs?.[0]?.title ?? 'none',
    })
  } catch (err) {
    return Response.json({ error: String(err) })
  }
}