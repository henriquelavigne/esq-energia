import { NextResponse } from 'next/server'
import { getAlocacoes, upsertAlocacao, desativarAlocacao } from '@/lib/db/alocacoes'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const usinaId = searchParams.get('usina_id')
    if (!usinaId) return NextResponse.json({ error: 'usina_id obrigatório' }, { status: 400 })
    return NextResponse.json(await getAlocacoes(usinaId))
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    return NextResponse.json(await upsertAlocacao(await req.json()), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
