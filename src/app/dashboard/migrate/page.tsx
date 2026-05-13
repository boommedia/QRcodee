import { createClient } from '@/lib/supabase/server'
import MigrateClient from '@/components/migrate/MigrateClient'

export default async function MigratePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  const { data: folders } = await supabase
    .from('folders')
    .select('id, name, color')
    .eq('user_id', user.id)
    .order('name')

  return <MigrateClient plan={sub?.plan || 'free'} folders={folders || []} />
}
