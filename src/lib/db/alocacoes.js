import { createClient } from '@/lib/supabase/server'

export async function getAlocacoes(usinaId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('alocacao_creditos')
    .select('*, unidades_consumidoras(codigo_uc, endereco, consumo_medio_kwh)')
    .eq('usina_id', usinaId)
    .eq('ativo', true)
    .order('percentual', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function upsertAlocacao(payload) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('alocacao_creditos')
    .upsert(payload, { onConflict: 'usina_id,uc_id' })
    .select().single()
  if (error) throw error
  return data
}

export async function desativarAlocacao(id) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('alocacao_creditos').update({ ativo: false }).eq('id', id)
  if (error) throw error
}
