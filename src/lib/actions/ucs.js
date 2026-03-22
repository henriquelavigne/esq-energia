'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function criarUC(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('unidades_consumidoras').insert({
    codigo_uc: formData.get('codigo_uc'),
    endereco: formData.get('endereco'),
    consumo_medio_kwh: Number(formData.get('consumo_medio_kwh')) || null,
    usina_id: formData.get('usina_id'),
    proprietario_id: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/consumidores')
  redirect('/dashboard/consumidores')
}
