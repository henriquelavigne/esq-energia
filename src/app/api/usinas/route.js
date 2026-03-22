import { NextResponse } from 'next/server'
import { getUsinas, createUsina } from '@/lib/db/usinas'

export async function GET() {
  try {
    return NextResponse.json(await getUsinas())
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    return NextResponse.json(await createUsina(await req.json()), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
