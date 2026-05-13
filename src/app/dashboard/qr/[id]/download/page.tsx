import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DownloadClient from '@/components/qr/DownloadClient'

export default async function DownloadQRPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: qr } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!qr) notFound()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  return <DownloadClient qr={qr} plan={sub?.plan || 'free'} />
}
