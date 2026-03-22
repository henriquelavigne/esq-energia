import { createClient } from '@/lib/supabase/server'

export async function getUsinas() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('usinas')
    .select('*, profiles(nome, email)')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getUsinaById(id) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('usinas')
    .select(`
      *,
      profiles(nome, email),
      alocacao_creditos(id, percentual, ativo, unidades_consumidoras(codigo_uc, endereco)),
      medicoes(id, mes_ano, geracao_kwh, fonte)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createUsina(payload) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('usinas').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateUsina(id, payload) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('usinas').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteUsina(id) {
  const supabase = await createClient()
  const { error } = await supabase.from('usinas').delete().eq('id', id)
  if (error) throw error
}
