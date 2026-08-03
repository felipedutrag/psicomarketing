import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: Request | NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    return NextResponse.json({ subscriberId: id, fields: [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
