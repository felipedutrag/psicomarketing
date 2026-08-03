import { NextRequest, NextResponse } from 'next/server'

interface LiveChatLogRequestBody {
  sessionId?: string
  messages?: unknown[]
  timestamp?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as LiveChatLogRequestBody
    return NextResponse.json({ success: true, logged: true, data: body })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
