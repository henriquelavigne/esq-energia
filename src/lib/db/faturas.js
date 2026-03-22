import { createClient } from '@/lib/supabase/server'

export async function getFaturasByUsina(usinaId, mesAno) {
  const supabase = await createClient()
  let query = supabase
    .from('faturas')
    .select('*, unidades_consumidoras(codigo_uc, endereco)')
    .eq('usina_id', usinaId)
    .order('mes_ano', { ascending: false })
  if (mesAno) query = query.eq('mes_ano', mesAno)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getFaturasByUC(ucId, limit = 12) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('faturas').select('*')
    .eq('uc_id', ucId)
    .order('mes_ano', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function calcularRateio(usinaId, mesAno) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('calcular_rateio_mensal', {
    p_usina_id: usinaId,
    p_mes_ano: mesAno,
  })
  if (error) throw error
  return data
}
