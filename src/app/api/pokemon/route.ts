import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import { getPokemon } from '@/lib/pokemon'

export function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))
    const search = searchParams.get('search') ?? ''
    const typesParam = searchParams.get('types') ?? ''
    const types = typesParam ? typesParam.split(',') : []

    return NextResponse.json(getPokemon({ limit, page, search, types }))
  } catch (error) {
    console.error('Error fetching Pokemon:', error)
    return NextResponse.json({ error: 'Failed to fetch Pokemon' }, { status: 500 })
  }
}
