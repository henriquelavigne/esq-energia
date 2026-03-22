import { NextResponse } from 'next/server'
import { calcularRateio } from '@/lib/db/faturas'

export async function POST(req) {
  try {
    const { usina_id, mes_ano } = await req.json()
    if (!usina_id || !mes_ano) {
      return NextResponse.json({ error: 'usina_id e mes_ano obrigatórios' }, { status: 400 })
    }
    const resultado = await calcularRateio(usina_id, mes_ano + '-01')
    return NextResponse.json({ resultado })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
