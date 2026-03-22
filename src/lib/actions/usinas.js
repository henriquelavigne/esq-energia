'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function criarUsina(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('usinas').insert({
    nome: formData.get('nome'),
    potencia_kwp: Number(formData.get('potencia_kwp')),
    concessionaria: formData.get('concessionaria'),
    proprietario_id: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/usinas')
  redirect('/dashboard/usinas')
}

export async function deletarUsina(id) {
  const supabase = await createClient()
  const { error } = await supabase.from('usinas').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/usinas')
  redirect('/dashboard/usinas')
}
