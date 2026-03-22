import { createClient } from '@/lib/supabase/server'

export async function getUCs(usinaId) {
  const supabase = await createClient()
  let query = supabase
    .from('unidades_consumidoras')
    .select('*, usinas(nome), profiles(nome, email)')
    .order('criado_em', { ascending: false })
  if (usinaId) query = query.eq('usina_id', usinaId)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getUCById(id) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('unidades_consumidoras')
    .select('*, usinas(nome), profiles(nome, email)')
    .eq('id', id).single()
  if (error) throw error
  return data
}

export async function createUC(payload) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('unidades_consumidoras').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateUC(id, payload) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('unidades_consumidoras').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}
