import { NextResponse } from 'next/server'
import { getUCs, createUC } from '@/lib/db/ucs'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    return NextResponse.json(await getUCs(searchParams.get('usina_id')))
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    return NextResponse.json(await createUC(await req.json()), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
