import { NextResponse } from 'next/server'
import { getUsinaById, updateUsina, deleteUsina } from '@/lib/db/usinas'

export async function GET(_, { params }) {
  try {
    return NextResponse.json(await getUsinaById(params.id))
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  try {
    return NextResponse.json(await updateUsina(params.id, await req.json()))
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_, { params }) {
  try {
    await deleteUsina(params.id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
