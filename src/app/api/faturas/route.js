import { NextResponse } from 'next/server'
import { getFaturasByUsina, getFaturasByUC } from '@/lib/db/faturas'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const ucId = searchParams.get('uc_id')
    const usinaId = searchParams.get('usina_id')
    const mesAno = searchParams.get('mes_ano')

    if (ucId) return NextResponse.json(await getFaturasByUC(ucId))
    if (usinaId) return NextResponse.json(await getFaturasByUsina(usinaId, mesAno))

    return NextResponse.json({ error: 'uc_id ou usina_id obrigatório' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
