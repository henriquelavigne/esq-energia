import { createClient } from '@/lib/supabase/server'

export async function getMedicoes(usinaId, limit = 24) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('medicoes')
    .select('*')
    .eq('usina_id', usinaId)
    .order('mes_ano', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function upsertMedicao(payload) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('medicoes')
    .upsert(payload, { onConflict: 'usina_id,mes_ano' })
    .select().single()
  if (error) throw error
  return data
}
