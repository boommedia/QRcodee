import { createClient } from '@/lib/supabase/server'
import FoldersClient from '@/components/folders/FoldersClient'

export default async function FoldersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: folders } = await supabase
    .from('folders')
    .select('id, name, color, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Get QR count per folder
  const { data: qrCodes } = await supabase
    .from('qr_codes')
    .select('folder_id')
    .eq('user_id', user.id)
    .not('folder_id', 'is', null)

  const counts: Record<string, number> = {}
  qrCodes?.forEach(q => { if (q.folder_id) counts[q.folder_id] = (counts[q.folder_id] || 0) + 1 })

  return <FoldersClient folders={(folders || []).map(f => ({ ...f, qr_count: counts[f.id] || 0 }))} />
}
