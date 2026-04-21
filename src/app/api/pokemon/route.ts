import type { NextRequest} from 'next/server';

import { NextResponse } from 'next/server'

import pokemonData from '@/data/pokemon.json'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const typesParam = searchParams.get('types') || ''
    const selectedTypes = typesParam ? typesParam.split(',') : []

    let filteredPokemon = pokemonData

    if (search) {
      filteredPokemon = filteredPokemon.filter(
        pokemon =>
          pokemon.name.toLowerCase().includes(search.toLowerCase()) ||
          pokemon.types.some(type =>
            type.toLowerCase().includes(search.toLowerCase())
          ) ||
          pokemon.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (selectedTypes.length > 0) {
      filteredPokemon = filteredPokemon.filter(pokemon =>
        selectedTypes.every(st =>
          pokemon.types.some(t => t.toLowerCase() === st.toLowerCase())
        )
      )
    }

    // Calculate pagination
    const total = filteredPokemon.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedPokemon = filteredPokemon.slice(startIndex, endIndex)

    return NextResponse.json({
      data: paginatedPokemon,
      pagination: {
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit,
        page,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching Pokemon:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Pokemon' },
      { status: 500 }
    )
  }
}
