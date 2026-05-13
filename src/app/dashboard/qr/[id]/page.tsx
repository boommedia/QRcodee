import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import QREditor from '@/components/qr/QREditor'

export default async function EditQRPage({ params }: { params: Promise<{ id: string }> }) {
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

  return <QREditor qr={qr} />
}
