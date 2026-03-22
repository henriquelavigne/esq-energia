'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function registrarMedicao(formData) {
  const supabase = await createClient()
  const { error } = await supabase.from('medicoes').upsert({
    usina_id: formData.get('usina_id'),
    mes_ano: formData.get('mes_ano') + '-01',
    geracao_kwh: Number(formData.get('geracao_kwh')),
    fonte: formData.get('fonte') || 'manual',
  }, { onConflict: 'usina_id,mes_ano' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/medicoes')
  return { success: true }
}

export async function calcularRateioAction(formData) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('calcular_rateio_mensal', {
    p_usina_id: formData.get('usina_id'),
    p_mes_ano: formData.get('mes_ano') + '-01',
  })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/balanco')
  return { resultado: data }
}

export async function salvarAlocacao(formData) {
  const supabase = await createClient()
  const { error } = await supabase.from('alocacao_creditos').upsert({
    usina_id: formData.get('usina_id'),
    uc_id: formData.get('uc_id'),
    percentual: Number(formData.get('percentual')),
    ativo: true,
  }, { onConflict: 'usina_id,uc_id' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/creditos')
  return { success: true }
}
