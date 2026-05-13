import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/settings/SettingsClient'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url, company')
    .eq('id', user.id)
    .single()

  return (
    <SettingsClient
      userId={user.id}
      initialName={profile?.full_name || ''}
      initialEmail={profile?.email || user.email || ''}
      initialCompany={profile?.company || ''}
      hasPassword={user.app_metadata?.provider === 'email'}
    />
  )
}
